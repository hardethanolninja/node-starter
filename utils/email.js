const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  //1 Create a transporter object
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    //activate in gmail "less secure apps" option
  });

  //2 define the email options
  const mailOptions = {
    from: 'Admin@Natours <admin@jon.io>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html: options.htmlMessage,
  };
  //3 send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
