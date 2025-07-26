import { Anthropic } from '@anthropic-ai/sdk';
import { readdir, readFile, writeFile, stat, copyFile } from 'fs/promises';
import { join, relative } from 'path';
import { execSync } from 'child_process';

export interface DevelopmentJob {
  output: string;
  completed: boolean;
  success: boolean;
  error?: string;
  clients: Set<any>;
}

// Safe file writing with backup and validation
async function safeWriteFile(
  filePath: string, 
  content: string, 
  job: DevelopmentJob, 
  broadcastToClients: Function
): Promise<void> {
  const backupPath = `${filePath}.bak`;
  
  try {
    // Create backup of original file
    await copyFile(filePath, backupPath);
    job.output += `📁 Created backup: ${filePath}.bak\n`;
    broadcastToClients(job, { type: 'output', data: `📁 Created backup: ${filePath}.bak\n` });
    
    // Basic validation for common file types
    const isValid = validateFileContent(filePath, content);
    if (!isValid) {
      throw new Error(`File content validation failed for ${filePath}`);
    }
    
    // Write the new content
    await writeFile(filePath, content, 'utf8');
    job.output += `✅ Successfully wrote ${filePath}\n`;
    broadcastToClients(job, { type: 'output', data: `✅ Successfully wrote ${filePath}\n` });
    
  } catch (error) {
    // Rollback if anything went wrong
    try {
      await copyFile(backupPath, filePath);
      job.output += `🔄 Rolled back ${filePath} from backup\n`;
      broadcastToClients(job, { type: 'output', data: `🔄 Rolled back ${filePath} from backup\n` });
    } catch (rollbackError) {
      job.output += `❌ Failed to rollback ${filePath}: ${rollbackError}\n`;
      broadcastToClients(job, { type: 'output', data: `❌ Failed to rollback ${filePath}: ${rollbackError}\n` });
    }
    throw error;
  }
}

// Cleanup backup files after successful operation
async function cleanupBackups(changedFiles: string[], job: DevelopmentJob, broadcastToClients: Function): Promise<void> {
  try {
    const { unlink } = await import('fs/promises');
    for (const filePath of changedFiles) {
      const backupPath = `${filePath}.bak`;
      try {
        await unlink(backupPath);
        job.output += `🗑️ Cleaned up backup: ${backupPath}\n`;
      } catch (error) {
        // Backup file might not exist, ignore cleanup errors
      }
    }
    broadcastToClients(job, { type: 'output', data: `🗑️ Cleaned up backup files\n` });
  } catch (error) {
    // Cleanup is optional, don't fail the entire process
    job.output += `⚠️ Backup cleanup failed (non-critical): ${error}\n`;
    broadcastToClients(job, { type: 'output', data: `⚠️ Backup cleanup failed (non-critical): ${error}\n` });
  }
}

// Basic file content validation
function validateFileContent(filePath: string, content: string): boolean {
  // Skip validation for very small files that might be intentionally minimal
  if (content.length < 10) {
    return false;
  }
  
  const extension = filePath.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx':
      // Check for basic structure - should have some content and balanced braces
      const openBraces = (content.match(/\{/g) || []).length;
      const closeBraces = (content.match(/\}/g) || []).length;
      
      // Allow some flexibility but catch obvious truncation
      if (Math.abs(openBraces - closeBraces) > 3) {
        return false;
      }
      
      // TypeScript/JavaScript files should typically have imports or exports
      if (content.length > 100 && 
          !content.includes('import') && 
          !content.includes('export') && 
          !content.includes('function') &&
          !content.includes('const') &&
          !content.includes('let') &&
          !content.includes('var')) {
        return false;
      }
      
      // Check if it ends abruptly (like missing closing braces/parentheses)
      const lastChar = content.trim().slice(-1);
      if (lastChar === ',' || lastChar === '(' || lastChar === '[') {
        return false;
      }
      
      return true;
      
    case 'json':
      try {
        JSON.parse(content);
        return true;
      } catch {
        return false;
      }
      
    default:
      // For other file types, just check that it's not empty and doesn't end abruptly
      return content.trim().length > 0;
  }
}

// Helper function to attempt error fixes with Claude
async function attemptErrorFix(
  originalPrompt: string,
  errorMessages: string,
  codebaseInfo: any,
  anthropic: any,
  attemptNumber: number
): Promise<string> {
  const systemMessage = `You are Claude Code, helping to fix TypeScript/build errors in a CHEC Portal application.

Project structure:
${codebaseInfo.structure}

You are fixing errors from a previous implementation attempt. The original request was: "${originalPrompt}"

Your task is to fix the TypeScript/build errors by making minimal, targeted changes to the code.

Return your response in this format:
<files>
<file path="path/to/file.ts">
// Complete corrected file content here
</file>
</files>

Focus ONLY on fixing the errors. Do not add new features or make unnecessary changes.`;

  const userMessage = `The following TypeScript/build errors occurred:

${errorMessages}

Please fix these errors with minimal changes to the codebase. This is attempt ${attemptNumber} of 2.

Here are the current key files:

${codebaseInfo.keyFiles}`;

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: userMessage
    }],
    system: systemMessage
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}

export async function executeClaude(
  prompt: string, 
  job: DevelopmentJob, 
  broadcastToClients: (job: DevelopmentJob, data: any) => void
): Promise<void> {
  try {
    console.log("Claude development request: " + prompt);
    job.output += "Starting Claude development process...\n";
    broadcastToClients(job, { type: 'output', data: "Starting Claude development process...\n" });

    // Initialize Anthropic client
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not found in environment variables');
    }
    
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    job.output += "Analyzing codebase...\n";
    broadcastToClients(job, { type: 'output', data: "Analyzing codebase...\n" });

    // Get project structure and key files with intelligent selection
    const projectPath = '/home/jeff/CHEC-Portal';
    const codebaseInfo = await getCodebaseInfo(projectPath, prompt);
    
    job.output += `📊 Context: ${codebaseInfo.totalTokens} tokens, ${codebaseInfo.filesIncluded}/${codebaseInfo.totalFilesFound} files included\n`;
    broadcastToClients(job, { type: 'output', data: `📊 Context: ${codebaseInfo.totalTokens} tokens, ${codebaseInfo.filesIncluded}/${codebaseInfo.totalFilesFound} files included\n` });
    
    // Check if context is still too large (Claude 3.5 Sonnet has ~200K token limit)
    if (codebaseInfo.totalTokens > 180000) {
      job.output += `⚠️ Warning: Context (${codebaseInfo.totalTokens} tokens) may exceed limits, reducing further...\n`;
      broadcastToClients(job, { type: 'output', data: `⚠️ Warning: Context (${codebaseInfo.totalTokens} tokens) may exceed limits, reducing further...\n` });
      
      // Fallback: Use even more aggressive selection
      const reducedCodebaseInfo = await getCodebaseInfo(projectPath);
      codebaseInfo.keyFiles = reducedCodebaseInfo.keyFiles.slice(0, Math.min(10000, reducedCodebaseInfo.keyFiles.length));
      codebaseInfo.totalTokens = estimateTokenCount(codebaseInfo.structure + codebaseInfo.keyFiles);
      
      job.output += `📊 Reduced context: ${codebaseInfo.totalTokens} tokens\n`;
      broadcastToClients(job, { type: 'output', data: `📊 Reduced context: ${codebaseInfo.totalTokens} tokens\n` });
    }
    
    job.output += "Sending request to Claude...\n";
    broadcastToClients(job, { type: 'output', data: "Sending request to Claude...\n" });

    // Create the Claude message
    const systemMessage = `You are Claude Code, helping to develop a TypeScript/React application called CHEC Portal. This is a homeschool co-op management system.

Project structure:
${codebaseInfo.structure}

Key information:
- Frontend: React + TypeScript + Vite
- Backend: Express + TypeScript
- Database: PostgreSQL with Drizzle ORM
- UI: Radix UI + shadcn/ui + Tailwind CSS

Your task is to implement the requested feature or fix. You should:
1. Make the necessary code changes
2. Ensure TypeScript compliance
3. Follow existing patterns in the codebase
4. Make clean, production-ready changes

Return your response in this format:
<files>
<file path="path/to/file.ts">
// Complete file content here
</file>
</files>

DO NOT ask for permission or confirmation. Implement the requested changes directly.`;

    const userMessage = `User request: ${prompt}

Here are the current key files:

${codebaseInfo.keyFiles}`;

    let response;
    try {
      response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: userMessage
        }],
        system: systemMessage
      });
    } catch (error: any) {
      if (error.status === 400 && error.message?.includes('too long')) {
        job.output += `❌ Context too large for Claude API (${codebaseInfo.totalTokens} estimated tokens)\n`;
        job.output += `💡 Try a more specific request or break it into smaller parts\n`;
        broadcastToClients(job, { type: 'output', data: `❌ Context too large for Claude API (${codebaseInfo.totalTokens} estimated tokens)\n💡 Try a more specific request or break it into smaller parts\n` });
        throw new Error(`Context too large: ${codebaseInfo.totalTokens} tokens. Please make a more specific request.`);
      }
      throw error;
    }

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
    
    job.output += "Claude response received. Processing changes...\n";
    broadcastToClients(job, { type: 'output', data: "Claude response received. Processing changes...\n" });

    // Parse and apply file changes
    const fileMatches = responseText.match(/<file path="([^"]+)">[\s\S]*?<\/file>/g);
    
    if (!fileMatches) {
      throw new Error('No file changes found in Claude response');
    }

    let changedFiles: string[] = [];
    
    for (const fileMatch of fileMatches) {
      const pathMatch = fileMatch.match(/<file path="([^"]+)">/);
      const contentMatch = fileMatch.match(/<file path="[^"]+">([\s\S]*?)<\/file>/);
      
      if (pathMatch && contentMatch) {
        const filePath = pathMatch[1];
        const fileContent = contentMatch[1].trim();
        const fullPath = join(projectPath, filePath);
        
        job.output += `Updating ${filePath}...\n`;
        broadcastToClients(job, { type: 'output', data: `Updating ${filePath}...\n` });
        
        await safeWriteFile(fullPath, fileContent, job, broadcastToClients);
        changedFiles.push(filePath);
      }
    }

    job.output += "Changes applied. Running type check...\n";
    broadcastToClients(job, { type: 'output', data: "Changes applied. Running type check...\n" });

    // Run TypeScript check with error recovery
    let typeCheckPassed = false;
    let maxRetries = 2;
    
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        execSync('npm run check', { cwd: projectPath, stdio: 'pipe' });
        job.output += "✅ TypeScript check passed\n";
        broadcastToClients(job, { type: 'output', data: "✅ TypeScript check passed\n" });
        typeCheckPassed = true;
        break;
      } catch (error) {
        const errorMessage = (error as any).stdout || (error as any).stderr || String(error);
        job.output += `❌ TypeScript errors found (attempt ${attempt}):\n${errorMessage}\n`;
        broadcastToClients(job, { type: 'output', data: `❌ TypeScript errors found (attempt ${attempt}):\n${errorMessage}\n` });
        
        if (attempt <= maxRetries) {
          job.output += `🔧 Attempting to fix errors automatically (${attempt}/${maxRetries})...\n`;
          broadcastToClients(job, { type: 'output', data: `🔧 Attempting to fix errors automatically (${attempt}/${maxRetries})...\n` });
          
          try {
            // Get fresh codebase info after the failed attempt
            const freshCodebaseInfo = await getCodebaseInfo(projectPath, prompt);
            
            // Ask Claude to fix the errors
            const fixResponse = await attemptErrorFix(
              prompt, 
              errorMessage, 
              freshCodebaseInfo, 
              anthropic, 
              attempt
            );
            
            // Parse and apply the fixes
            const fixFileMatches = fixResponse.match(/<file path="([^"]+)">[\s\S]*?<\/file>/g);
            
            if (fixFileMatches) {
              job.output += `Applying ${fixFileMatches.length} error fixes...\n`;
              broadcastToClients(job, { type: 'output', data: `Applying ${fixFileMatches.length} error fixes...\n` });
              
              for (const fileMatch of fixFileMatches) {
                const pathMatch = fileMatch.match(/<file path="([^"]+)">/);
                const contentMatch = fileMatch.match(/<file path="[^"]+">([\s\S]*?)<\/file>/);
                
                if (pathMatch && contentMatch) {
                  const filePath = pathMatch[1];
                  const fileContent = contentMatch[1].trim();
                  const fullPath = join(projectPath, filePath);
                  
                  job.output += `Fixing ${filePath}...\n`;
                  broadcastToClients(job, { type: 'output', data: `Fixing ${filePath}...\n` });
                  
                  await safeWriteFile(fullPath, fileContent, job, broadcastToClients);
                  if (!changedFiles.includes(filePath)) {
                    changedFiles.push(filePath);
                  }
                }
              }
            } else {
              job.output += "⚠️ No fixes found in Claude response, retrying type check...\n";
              broadcastToClients(job, { type: 'output', data: "⚠️ No fixes found in Claude response, retrying type check...\n" });
            }
          } catch (fixError) {
            job.output += `⚠️ Error during fix attempt: ${fixError}\n`;
            broadcastToClients(job, { type: 'output', data: `⚠️ Error during fix attempt: ${fixError}\n` });
          }
        } else {
          job.output += `❌ Failed to fix TypeScript errors after ${maxRetries} attempts\n`;
          broadcastToClients(job, { type: 'output', data: `❌ Failed to fix TypeScript errors after ${maxRetries} attempts\n` });
          throw new Error(`TypeScript check failed after ${maxRetries} fix attempts`);
        }
      }
    }
    
    if (!typeCheckPassed) {
      throw new Error('TypeScript check failed after all attempts');
    }

    // Commit changes to git
    job.output += "Committing changes to git...\n";
    broadcastToClients(job, { type: 'output', data: "Committing changes to git...\n" });
    
    try {
      // Add changed files
      for (const file of changedFiles) {
        execSync(`git add "${file}"`, { cwd: projectPath });
      }
      
      // Create commit with user's request as message
      const commitMessage = `feat: ${prompt}\n\n🤖 Generated with Claude via Development page\n\nCo-Authored-By: Claude <noreply@anthropic.com>`;
      execSync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, { cwd: projectPath });
      
      job.output += "✅ Changes committed to git\n";
      broadcastToClients(job, { type: 'output', data: "✅ Changes committed to git\n" });
    } catch (error) {
      job.output += `Git commit failed: ${error}\n`;
      broadcastToClients(job, { type: 'output', data: `Git commit failed: ${error}\n` });
    }

    // Build the application with error recovery
    job.output += "Building application...\n";
    broadcastToClients(job, { type: 'output', data: "Building application...\n" });
    
    let buildPassed = false;
    
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        execSync('npm run build', { cwd: projectPath, encoding: 'utf8' });
        job.output += "✅ Build successful\n";
        broadcastToClients(job, { type: 'output', data: "✅ Build successful\n" });
        buildPassed = true;
        break;
      } catch (error) {
        const errorMessage = (error as any).stdout || (error as any).stderr || String(error);
        job.output += `❌ Build failed (attempt ${attempt}):\n${errorMessage}\n`;
        broadcastToClients(job, { type: 'output', data: `❌ Build failed (attempt ${attempt}):\n${errorMessage}\n` });
        
        if (attempt <= maxRetries) {
          job.output += `🔧 Attempting to fix build errors automatically (${attempt}/${maxRetries})...\n`;
          broadcastToClients(job, { type: 'output', data: `🔧 Attempting to fix build errors automatically (${attempt}/${maxRetries})...\n` });
          
          try {
            // Get fresh codebase info after the failed attempt
            const freshCodebaseInfo = await getCodebaseInfo(projectPath, prompt);
            
            // Ask Claude to fix the build errors
            const fixResponse = await attemptErrorFix(
              prompt, 
              `Build Error: ${errorMessage}`, 
              freshCodebaseInfo, 
              anthropic, 
              attempt
            );
            
            // Parse and apply the fixes
            const fixFileMatches = fixResponse.match(/<file path="([^"]+)">[\s\S]*?<\/file>/g);
            
            if (fixFileMatches) {
              job.output += `Applying ${fixFileMatches.length} build fixes...\n`;
              broadcastToClients(job, { type: 'output', data: `Applying ${fixFileMatches.length} build fixes...\n` });
              
              for (const fileMatch of fixFileMatches) {
                const pathMatch = fileMatch.match(/<file path="([^"]+)">/);
                const contentMatch = fileMatch.match(/<file path="[^"]+">([\s\S]*?)<\/file>/);
                
                if (pathMatch && contentMatch) {
                  const filePath = pathMatch[1];
                  const fileContent = contentMatch[1].trim();
                  const fullPath = join(projectPath, filePath);
                  
                  job.output += `Fixing ${filePath}...\n`;
                  broadcastToClients(job, { type: 'output', data: `Fixing ${filePath}...\n` });
                  
                  await safeWriteFile(fullPath, fileContent, job, broadcastToClients);
                  if (!changedFiles.includes(filePath)) {
                    changedFiles.push(filePath);
                  }
                }
              }
            } else {
              job.output += "⚠️ No build fixes found in Claude response, retrying build...\n";
              broadcastToClients(job, { type: 'output', data: "⚠️ No build fixes found in Claude response, retrying build...\n" });
            }
          } catch (fixError) {
            job.output += `⚠️ Error during build fix attempt: ${fixError}\n`;
            broadcastToClients(job, { type: 'output', data: `⚠️ Error during build fix attempt: ${fixError}\n` });
          }
        } else {
          job.output += `❌ Failed to fix build errors after ${maxRetries} attempts\n`;
          broadcastToClients(job, { type: 'output', data: `❌ Failed to fix build errors after ${maxRetries} attempts\n` });
          throw new Error(`Build failed after ${maxRetries} fix attempts`);
        }
      }
    }
    
    if (!buildPassed) {
      throw new Error('Build failed after all attempts');
    }

    // Clean up backup files after successful completion
    await cleanupBackups(changedFiles, job, broadcastToClients);
    
    // Mark job as completed successfully
    job.completed = true;
    job.success = true;
    job.output += "\n✅ Implementation completed successfully!\n";
    job.output += "💡 Click the 'Deploy Application' button below to make changes live.\n";
    broadcastToClients(job, { 
      type: 'complete', 
      data: "\n✅ Implementation completed successfully!\n💡 Click the 'Deploy Application' button below to make changes live.\n",
      success: true 
    });

  } catch (error) {
    console.error('Claude development error:', error);
    job.completed = true;
    job.success = false;
    job.error = (error as Error).message;
    job.output += `\n❌ Error: ${(error as Error).message}\n`;
    broadcastToClients(job, { 
      type: 'complete', 
      data: `\n❌ Error: ${(error as Error).message}\n`,
      success: false,
      error: (error as Error).message
    });
  }
}

// Estimate token count (rough approximation: 1 token ≈ 4 characters)
function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

// Select most relevant files based on prompt
function selectRelevantFiles(allFiles: Array<{path: string, content: string}>, prompt: string, maxTokens: number = 40000): Array<{path: string, content: string}> {
  const promptLower = prompt.toLowerCase();
  const relevanceScores = allFiles.map(file => {
    let score = 0;
    const fileName = file.path.toLowerCase();
    const fileContent = file.content.toLowerCase().slice(0, 500); // Just check beginning
    
    // Higher priority for files mentioned in prompt
    if (promptLower.includes(fileName.split('/').pop() || '')) score += 100;
    
    // Score based on file type relevance to common requests
    if (fileName.includes('route')) score += 20;
    if (fileName.includes('component') || fileName.includes('page')) score += 15;
    if (fileName.includes('schema') || fileName.includes('type')) score += 10;
    if (fileName.includes('style') || fileName.includes('css')) score += (promptLower.includes('style') || promptLower.includes('css') || promptLower.includes('color')) ? 30 : 5;
    if (fileName.includes('form')) score += promptLower.includes('form') ? 25 : 5;
    if (fileName.includes('auth')) score += promptLower.includes('auth') || promptLower.includes('login') ? 25 : 5;
    
    // Score based on content relevance
    const relevantTerms = ['export', 'import', 'function', 'const', 'interface', 'type'];
    relevantTerms.forEach(term => {
      if (fileContent.includes(term)) score += 2;
    });
    
    return { ...file, score };
  });
  
  // Sort by relevance score
  relevanceScores.sort((a, b) => b.score - a.score);
  
  // Select files within token budget
  const selectedFiles = [];
  let currentTokens = 0;
  
  for (const file of relevanceScores) {
    const fileTokens = estimateTokenCount(file.content);
    if (currentTokens + fileTokens <= maxTokens) {
      selectedFiles.push(file);
      currentTokens += fileTokens;
    } else {
      // Try to include a truncated version if there's some space left
      const remainingTokens = maxTokens - currentTokens;
      if (remainingTokens > 500) { // Only if we have reasonable space left
        const truncatedContent = file.content.slice(0, remainingTokens * 4 - 100);
        selectedFiles.push({
          ...file,
          content: truncatedContent + '\n... (truncated due to context limit)'
        });
      }
      break;
    }
  }
  
  return selectedFiles;
}

// Helper function to get codebase information with context management
async function getCodebaseInfo(projectPath: string, prompt?: string) {
  const structure: string[] = [];
  const allFiles: Array<{path: string, content: string}> = [];
  
  async function walkDir(dir: string, prefix = '', maxDepth = 3, currentDepth = 0) {
    if (currentDepth >= maxDepth) return;
    
    const items = await readdir(dir);
    
    for (const item of items) {
      if (item.startsWith('.') || item === 'node_modules' || item === 'dist') continue;
      
      const fullPath = join(dir, item);
      const relativePath = relative(projectPath, fullPath);
      const stats = await stat(fullPath);
      
      if (stats.isDirectory()) {
        structure.push(`${prefix}📁 ${item}/`);
        await walkDir(fullPath, prefix + '  ', maxDepth, currentDepth + 1);
      } else {
        structure.push(`${prefix}📄 ${item}`);
        
        // Collect all potential files for intelligent selection
        if (item.endsWith('.tsx') || item.endsWith('.ts') || item === 'package.json') {
          try {
            const content = await readFile(fullPath, 'utf8');
            allFiles.push({
              path: relativePath,
              content: content
            });
          } catch (e) {
            // Skip files that can't be read
          }
        }
      }
    }
  }
  
  await walkDir(projectPath);
  
  // Use intelligent file selection if prompt is provided
  const selectedFiles = prompt 
    ? selectRelevantFiles(allFiles, prompt, 40000) // Reserve ~40K tokens for files
    : allFiles.slice(0, 20).map(f => ({ // Fallback: just take first 20 files
        ...f, 
        content: f.content.slice(0, 2000) + (f.content.length > 2000 ? '\n... (truncated)' : '')
      }));
  
  const keyFilesContent = selectedFiles.map(file => 
    `--- ${file.path} ---\n${file.content}\n`
  ).join('\n\n');
  
  const structureContent = structure.join('\n');
  const totalTokens = estimateTokenCount(structureContent + keyFilesContent);
  
  return {
    structure: structureContent,
    keyFiles: keyFilesContent,
    totalTokens,
    filesIncluded: selectedFiles.length,
    totalFilesFound: allFiles.length
  };
}