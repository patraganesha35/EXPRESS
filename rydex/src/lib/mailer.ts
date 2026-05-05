import nodemailer from "nodemailer"

const getTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASS,
    },
  });
};

export const sendMail = async (to: string, subject: string, html: string) => {
  try {
    const transporter = getTransporter();
    
    if (!process.env.EMAIL || !process.env.PASS) {
      throw new Error("EMAIL or PASS environment variables are missing");
    }

    const info = await transporter.sendMail({
      from: `"RYDEX" <${process.env.EMAIL}>`,
      to,
      subject,
      html,
    });

    console.log("✅ Email sent successfully: " + info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Mailer Error:", error);
    throw error;
  }
};