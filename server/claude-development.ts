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

    // Run TypeScript check
    try {
      execSync('npm run check', { cwd: projectPath, stdio: 'pipe' });
      job.output += "✅ TypeScript check passed\n";
      broadcastToClients(job, { type: 'output', data: "✅ TypeScript check passed\n" });
    } catch (error) {
      job.output += `❌ TypeScript errors found:\n${error}\n`;
      broadcastToClients(job, { type: 'output', data: `❌ TypeScript errors found:\n${error}\n` });
      throw new Error('TypeScript check failed');
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

    // Build the application
    job.output += "Building application...\n";
    broadcastToClients(job, { type: 'output', data: "Building application...\n" });
    
    try {
      execSync('npm run build', { cwd: projectPath, encoding: 'utf8' });
      job.output += "✅ Build successful\n";
      broadcastToClients(job, { type: 'output', data: "✅ Build successful\n" });
    } catch (error) {
      job.output += `❌ Build failed:\n${error}\n`;
      broadcastToClients(job, { type: 'output', data: `❌ Build failed:\n${error}\n` });
      throw new Error('Build failed');
    }

    // Deploy with PM2 restart
    job.output += "Deploying application...\n";
    broadcastToClients(job, { type: 'output', data: "Deploying application...\n" });
    
    try {
      execSync('pm2 restart all', { cwd: projectPath });
      job.output += "🚀 Application deployed successfully!\n";
      broadcastToClients(job, { type: 'output', data: "🚀 Application deployed successfully!\n" });
    } catch (error) {
      job.output += `Deployment warning: ${error}\n`;
      broadcastToClients(job, { type: 'output', data: `Deployment warning: ${error}\n` });
    }

    // Mark job as completed successfully
    job.completed = true;
    job.success = true;
    job.output += "\n✅ Development request completed successfully!\n";
    broadcastToClients(job, { 
      type: 'complete', 
      data: "\n✅ Development request completed successfully!\n",
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