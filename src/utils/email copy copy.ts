import emailjs from '@emailjs/browser';

// Configuration
const CONFIG = {
  serviceId: 'service_qj44izj',
  publicKey: 'aImlP6dotqO-E3y6h',
  templates: {
    contact: 'template_k92zaj2',
    order: 'purchase_confirmation',
    documentDelivery: 'document_delivery'
  },
  developerEmail: 'mohanselemophile@gmail.com'
};

// Type Definitions
interface ContactFormData {
  from_name: string;
  from_email: string;
  project_type: string;
  budget: string;
  message: string;
}

interface OrderConfirmationData {
  project_title: string;
  customer_name: string;
  price: string;
  download_instructions?: string;
  support_email?: string;
  order_id?: string;
}

interface DocumentDeliveryData {
  project_title: string;
  customer_name: string;
  customer_email: string;
  order_id: string;
  documents: Array<{
    name: string;
    url: string;
    category: string;
    review_stage: string;
    description?: string;
  }>;
  review_stages?: string;
  documents_count?: number;
  current_date?: string;
  access_expires?: string;
  support_email?: string;
}

// Utility Functions
const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const getCurrentDateTime = () => {
  const now = new Date();
  return {
    date: now.toLocaleDateString(),
    time: now.toLocaleTimeString(),
    datetime: now.toISOString()
  };
};

// Email Services
export const sendContactForm = async (data: ContactFormData): Promise<void> => {
  if (!validateEmail(data.from_email)) {
    throw new Error('Invalid sender email address');
  }

  const { date, time } = getCurrentDateTime();

  try {
    await emailjs.send(
      CONFIG.serviceId,
      CONFIG.templates.contact,
      {
        // Template variables
        name: data.from_name,          // For {{name}} in template
        email: data.from_email,        // For {{email}} in template
        project_type: data.project_type,
        budget: data.budget,
        message: data.message,
        current_date: date,
        current_time: time,
        title: `New inquiry from ${data.from_name}`,
        
        // Email headers
        to_email: CONFIG.developerEmail,
        reply_to: data.from_email
      },
      CONFIG.publicKey
    );
  } catch (error) {
    console.error('Contact form email failed:', error);
    throw new Error('Failed to send your message. Please try again later.');
  }
};

export const sendOrderConfirmation = async (
  data: OrderConfirmationData,
  recipientEmail: string
): Promise<void> => {
  if (!validateEmail(recipientEmail)) {
    throw new Error('Invalid recipient email address');
  }

  const { date } = getCurrentDateTime();

  try {
    await emailjs.send(
      CONFIG.serviceId,
      CONFIG.templates.order,
      {
        ...data,
        email: recipientEmail,       // For template variables
        current_date: date,
        to_email: recipientEmail,    // Recipient address
        reply_to: data.support_email || CONFIG.developerEmail,
        download_instructions: 'You will receive a separate email with download links for all project documents within 24 hours.',
        support_email: CONFIG.developerEmail
      },
      CONFIG.publicKey
    );
  } catch (error) {
    console.error('Order confirmation failed:', error);
    throw new Error('Failed to send order confirmation. Please try again later.');
  }
};

export const sendDocumentDelivery = async (data: DocumentDeliveryData): Promise<void> => {
  if (!validateEmail(data.customer_email)) {
    throw new Error('Invalid recipient email address');
  }

  const { date } = getCurrentDateTime();

  // Format documents list for email
  const documentsHtml = data.documents.map(doc => `
    <div style="margin-bottom: 15px; padding: 10px; border: 1px solid #e5e7eb; border-radius: 5px;">
      <h4 style="margin: 0 0 5px 0; color: #1f2937;">${doc.name}</h4>
      <p style="margin: 0 0 5px 0; font-size: 14px; color: #6b7280;">
        Category: ${doc.category} | Review Stage: ${doc.review_stage.replace('_', ' ').toUpperCase()}
      </p>
      ${doc.description ? `<p style="margin: 0 0 8px 0; font-size: 13px; color: #9ca3af;">${doc.description}</p>` : ''}
      <a href="${doc.url}" 
         style="display: inline-block; padding: 8px 16px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 4px; font-size: 14px;"
         target="_blank">
        Download Document
      </a>
    </div>
  `).join('');

  const documentsText = data.documents.map(doc => `
    ${doc.name}
    Category: ${doc.category} | Review Stage: ${doc.review_stage.replace('_', ' ').toUpperCase()}
    ${doc.description ? `Description: ${doc.description}` : ''}
    Download: ${doc.url}
    
  `).join('');

  try {
    await emailjs.send(
      CONFIG.serviceId,
      CONFIG.templates.documentDelivery,
      {
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        project_title: data.project_title,
        order_id: data.order_id,
        documents_html: documentsHtml,
        documents_text: documentsText,
        documents_count: data.documents_count || data.documents.length,
        review_stages: data.review_stages || 'All Review Stages',
        current_date: data.current_date || date,
        access_expires: data.access_expires || 'Never (lifetime access)',
        support_email: data.support_email || CONFIG.developerEmail,
        to_email: data.customer_email,
        reply_to: CONFIG.developerEmail
      },
      CONFIG.publicKey
    );
  } catch (error) {
    console.error('Document delivery email failed:', error);
    throw new Error('Failed to send document delivery email. Please try again later.');
  }
};

// Generate download instructions for order confirmation
export const generateDownloadInstructions = (projectTitle: string, orderId: string): string => {
  return `
Thank you for purchasing "${projectTitle}"!

Your Order ID: ${orderId}

What happens next:
1. You will receive a separate email within 24 hours containing download links for all project documents
2. Documents are organized by review stages (Review 1, 2, and 3)
3. Each document includes presentations, documentation, and reports as applicable
4. You'll have lifetime access to download these documents

If you have any questions or need support, please contact us at ${CONFIG.developerEmail}

Thank you for your business!
  `.trim();
};

// Send document delivery email from admin panel
export const sendDocumentDeliveryFromAdmin = async (data: DocumentDeliveryData): Promise<void> => {
  return sendDocumentDelivery(data);
};

// Optional: Add this if you need to send test emails during development
export const testEmailService = async () => {
  try {
    await sendContactForm({
      from_name: 'Test User',
      from_email: 'test@example.com',
      project_type: 'Website Development',
      budget: '$1000-$2000',
      message: 'This is a test message from the email service'
    });
    console.log('Test email sent successfully');
  } catch (error) {
    console.error('Test email failed:', error);
  }
};