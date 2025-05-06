import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOrderNotification(emailData: {
  name: string;
  email: string;
  phone?: string;
  projectDescription: string;
  imagePaths: string[];
}) {
  const { name, email, phone, projectDescription, imagePaths } = emailData;

  const imageLinks = imagePaths
    .map((path) => `<a href="https://woodwork-backend.onrender.com${path}">${path}</a>`)
    .join("<br>");

  // Email to Kevin
  await resend.emails.send({
    from: "orders@10thstreetwoodworks.com",
    to: "kevinzimmer520@gmail.com",
    replyTo: "10thstreetwoodwork@gmail.com",
    subject: "📥 New Custom Order Received",
    html: `
      <h2>New Order Submitted</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone || "N/A"}</p>
      <p><strong>Description:</strong><br>${projectDescription}</p>
      ${imageLinks ? `<p><strong>Images:</strong><br>${imageLinks}</p>` : ""}
    `,
  });

  // Email to customer
  await resend.emails.send({
    from: "orders@10thstreetwoodworks.com",
    to: email,
    replyTo: "10thstreetwoodwork@gmail.com",
    subject: "Thanks for your custom order!",
    html: `
      <h2>Thanks, ${name}!</h2>
      <p>I've received your order and will follow up soon.</p>
      <p><strong>Your Description:</strong><br>${projectDescription}</p>
      ${imageLinks ? `<p>Uploaded Images:<br>${imageLinks}</p>` : ""}
      <p>– Kevin at 10th Street Woodworks</p>
    `,
  });
}
