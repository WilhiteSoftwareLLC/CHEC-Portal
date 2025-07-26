import { Anthropic } from '@anthropic-ai/sdk';
import { readdir, readFile, writeFile, stat } from 'fs/promises';
import { join, relative } from 'path';
import { execSync } from 'child_process';

export interface DevelopmentJob {
  output: string;
  completed: boolean;
  success: boolean;
  error?: string;
  clients: Set<any>;
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

    // Get project structure and key files
    const projectPath = '/home/jeff/CHEC-Portal';
    const codebaseInfo = await getCodebaseInfo(projectPath);
    
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

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: userMessage
      }],
      system: systemMessage
    });

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
        
        await writeFile(fullPath, fileContent, 'utf8');
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
            const freshCodebaseInfo = await getCodebaseInfo(projectPath);
            
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
                  
                  await writeFile(fullPath, fileContent, 'utf8');
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
            const freshCodebaseInfo = await getCodebaseInfo(projectPath);
            
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
                  
                  await writeFile(fullPath, fileContent, 'utf8');
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

// Helper function to get codebase information
async function getCodebaseInfo(projectPath: string) {
  const structure: string[] = [];
  const keyFiles: string[] = [];
  
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
        
        // Read key files
        if (item.endsWith('.tsx') || item.endsWith('.ts') || item === 'package.json') {
          try {
            const content = await readFile(fullPath, 'utf8');
            keyFiles.push(`--- ${relativePath} ---\n${content.slice(0, 2000)}${content.length > 2000 ? '\n... (truncated)' : ''}\n`);
          } catch (e) {
            // Skip files that can't be read
          }
        }
      }
    }
  }
  
  await walkDir(projectPath);
  
  return {
    structure: structure.join('\n'),
    keyFiles: keyFiles.join('\n\n')
  };
}