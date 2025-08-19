import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';

const execAsync = promisify(exec);

// Server-side hash generation function
function generateFamilyHash(familyId: number): string {
  return crypto.createHash('sha256')
    .update(familyId.toString())
    .digest('hex')
    .substring(0, 8);
}

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth?: {
    user?: string;
    pass?: string;
  };
}

interface FamilyData {
  id: number;
  lastName: string;
  father: string | null;
  mother: string | null;
  email: string | null;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private useSmtp: boolean;

  constructor() {
    this.useSmtp = process.env.USE_SMTP !== '0';
    
    if (this.useSmtp) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT || '25'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        // No authentication needed for local mail server
      });
    }
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.useSmtp) {
      // Test mail command availability
      try {
        await execAsync('which mail');
        return true;
      } catch (error) {
        console.error('mail command not found:', error);
        return false;
      }
    }

    try {
      if (!this.transporter) {
        throw new Error('SMTP transporter not initialized');
      }
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('SMTP connection verification failed:', error);
      return false;
    }
  }

  private generateFamilyLinksEmail(family: FamilyData, baseUrl: string): string {
    const familyHash = generateFamilyHash(family.id);
    const invoiceUrl = `${baseUrl}/invoice/${familyHash}`;
    const schedulesUrl = `${baseUrl}/schedules/${familyHash}`;
    
    const familyName = [family.father, family.mother].filter(Boolean).join(' & ');
    const displayName = familyName ? `${familyName} ${family.lastName}` : `${family.lastName} family`;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CHEC Family Links</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e0e0e0;
        }
        .header h1 {
            color: #2563eb;
            margin: 0;
            font-size: 28px;
        }
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
        }
        .link-section {
            background-color: #f8fafc;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
            border-left: 4px solid #2563eb;
        }
        .link-button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #2563eb;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 8px 8px 8px 0;
            transition: background-color 0.3s;
        }
        .link-button:hover {
            background-color: #1d4ed8;
        }
        .link-button.secondary {
            background-color: #059669;
        }
        .link-button.secondary:hover {
            background-color: #047857;
        }
        .description {
            color: #666;
            font-size: 14px;
            margin-top: 8px;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            font-size: 14px;
            color: #666;
            text-align: center;
        }
        .security-note {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            font-size: 14px;
        }
        .security-note strong {
            color: #d68910;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>CHEC Family Portal</h1>
        </div>
        
        <div class="greeting">
            Dear ${displayName},
        </div>
        
        <p>Here are your personalized family links for easy access to your CHEC information.</p>
        
        <div class="link-section">
            <h3 style="margin-top: 0; color: #2563eb;">📋 Family Invoice</h3>
            <p>View your family invoice including all fees, payments, and current balance.</p>
            <a href="${invoiceUrl}" class="link-button">View Family Invoice</a>
            <div class="description">See all charges, payments made, and outstanding balance</div>
        </div>
        
        <div class="link-section">
            <h3 style="margin-top: 0; color: #059669;">🎓 Student Schedules</h3>
            <p>Access the course schedules for all students in your family.</p>
            <a href="${schedulesUrl}" class="link-button secondary">View Student Schedules</a>
            <div class="description">See courses, instructors, locations, and time slots</div>
        </div>
        
        <p>Both links should work on any device and are optimized for printing if you need hard copies.</p>
        
        <div class="footer">
            <p><strong>CHEC Portal</strong><br>
            This email was sent automatically from the CHEC Portal.
            </p>
        </div>
    </div>
</body>
</html>`;
  }

  private async sendEmailWithMailCommand(
    to: string,
    subject: string,
    htmlContent: string,
    textContent: string,
    fromEmail: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Create a temporary file for the email content
      const tempFile = `/tmp/email_${Date.now()}.txt`;
      
      await fs.writeFile(tempFile, textContent);
      
      // Use mail command to send email
      const command = `mail -s "${subject}" -r "${fromEmail}" "${to}" < "${tempFile}"`;
      await execAsync(command);
      
      // Clean up temp file
      await fs.unlink(tempFile);
      
      return { success: true };
    } catch (error) {
      console.error('Failed to send email with mail command:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async sendFamilyLinks(
    family: FamilyData,
    baseUrl: string,
    fromEmail: string = process.env.FROM_EMAIL || '',
    fromName: string = 'CHEC Portal'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!family.email) {
        return { success: false, error: 'No email address for family' };
      }

      if (!fromEmail) {
        throw new Error('FROM_EMAIL environment variable is required');
      }

      const htmlContent = this.generateFamilyLinksEmail(family, baseUrl);
      const displayName = [family.father, family.mother].filter(Boolean).join(' & ');
      const familyDisplayName = displayName ? `${displayName} ${family.lastName}` : `${family.lastName} family`;

      const subject = 'CHEC Family Invoice and Schedule Links';
      const textContent = `Dear ${familyDisplayName},

Here are your personalized family links for easy access to your CHEC information:

Family Invoice: ${baseUrl}/invoice/${generateFamilyHash(family.id)}
Student Schedules: ${baseUrl}/schedules/${generateFamilyHash(family.id)}

This email was sent automatically from the CHEC Portal.`;

      if (!this.useSmtp) {
        // Use mail command
        return await this.sendEmailWithMailCommand(
          family.email,
          subject,
          htmlContent,
          textContent,
          fromEmail
        );
      }

      // Use SMTP
      if (!this.transporter) {
        throw new Error('SMTP transporter not initialized');
      }

      const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: family.email,
        subject,
        html: htmlContent,
        text: textContent,
      };

      await this.transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Failed to send email to family:', family.lastName, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async sendBulkFamilyLinks(
    families: FamilyData[],
    baseUrl: string,
    onProgress?: (sent: number, total: number, currentFamily: string) => void
  ): Promise<{ 
    totalSent: number; 
    totalFailed: number; 
    failedFamilies: Array<{ family: string; error: string }>;
  }> {
    let totalSent = 0;
    let totalFailed = 0;
    const failedFamilies: Array<{ family: string; error: string }> = [];

    for (let i = 0; i < families.length; i++) {
      const family = families[i];
      
      if (onProgress) {
        onProgress(totalSent, families.length, family.lastName);
      }

      const result = await this.sendFamilyLinks(family, baseUrl);
      
      if (result.success) {
        totalSent++;
      } else {
        totalFailed++;
        failedFamilies.push({
          family: family.lastName,
          error: result.error || 'Unknown error'
        });
      }

      // Small delay between emails to avoid overwhelming SMTP server
      if (i < families.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return {
      totalSent,
      totalFailed,
      failedFamilies
    };
  }
}

export const emailService = new EmailService();
