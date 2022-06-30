const nodemailer = require('nodemailer');
const pug = require('pug');
const { convert } = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `${process.env.EMAIL_FROM_NAME} ${process.env.EMAIL_FROM_ADDRESS}`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'development') {
      //1 Create a transporter object NODEMAILER
      return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    }
    //development mailer
    return nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: process.env.SENDGRID_USERNAME,
        pass: process.env.SENDGRID_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    //1 render HTML based on pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });

    //2 define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      //include text version for email if html is not desired
      text: convert(html),
    };
    //3 create transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome_email', 'Welcome to the Natours Family!');
  }

  async sendPasswordReset() {
    await this.send(
      'password_reset',
      'Your password reset token (valid for 10 minutes).'
    );
  }
};
