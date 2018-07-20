/*
  This nodejs module has a few env variables:
    DEVELOPMENT
    SENDGRID_API_KEY
    EMAIL
    BCC
    DAY_OF_WEEK
    HOUR
    MINUTE


  REQUIRED ENV VARIABLES (Will not run without these):
    SENDGRID_API_KEY - Generated through your SendGrid account
    EMAIL - Sender email

  OPTIONAL ENV VARIABLES:
  DEVELOPMENT - Toggle development mode (Prevents program from actually sending an email).
  BCC - Email for SendGrid to send a carbon copy to
  DAY_OF_WEEK - 0-6. 0 = Sunday
  HOUR - 0-23
  MINUTE - 0-59

  NOTE: If no time variables are present, the ip address list will not clear itself until the node environment closes.
  Examples for time variable usage:
    DAY_OF_WEEK=5
    HOUR=4
    MINUTE=30
  Result: Task triggers every Friday at 04:30.
    HOUR=3
    MINUTE=3
  Result: Task triggers everyday at 03:00;
    MINUTE=5
  Result: Task triggers whenever the minute hand is :05.
*/

const sgMail = require('@sendgrid/mail');
const schedule = require('node-schedule');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

let devMode = false;
let htmlString = '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd"><html><head><title>Getting Involved With Hourai Teahouse</title></head><body><table style="height: 100%; width: 100%;"><tr style="background-color: #2E3046; color: white;"><th style="height: 100%; width: 100%;"><h1 style="font-size: 2em;">Hourai Teahouse</h1></th></tr><tr><td><p>Hello,</p><p>Thank you for expressing interest in joining our team!</p><p>According to your submission, you have selected the following roles:</p><p id="programmer" style="padding-left: 25px;"></p><p id="modeler" style="padding-left: 25px;"></p><p id="animator" style="padding-left: 25px;"></p><p id="musician" style="padding-left: 25px;"></p><p>Please note that these roles are just generalized titles. If you feel that none of these roles adequately describe your field of interest, that is not a problem. As a community group, we are always open to anyone interested in development. When we contact you, we can fully discuss your involvement with Hourai Teahouse.</p><p>If you want to skip the wait, join us on Discord to jump right into things (Link provided below). Otherwise we will get back to you with more details through one of your provided contacts:</p><p style="padding-left: 25px;">Email: <span id="email"></span></p><p style="padding-left: 25px;">Discord: <span id="discordUser"></span></p><p style="padding-left: 25px;">Github: <span id="githubUser"></span></p></td></tr><tr><td><p>Regards,</p><p>Hourai Teahouse</p></td></tr><tr><td><p>Join us on Discord: <a href="https://discord.gg/VuZhs9V">https://discord.gg/VuZhs9V</a></tr><tr><td><p style="font-size: 12px;">NOTE: This is an automated email. Please do not reply to this email.</p></td></tr></table></body></html>';
let addressList = [];
let resetTime = {};
let resetTask;

if ( process.env.DEVELOPMENT ) {
  devMode = true;
}
if ( process.env.MINUTE ) {
  resetTime.minute = process.env.MINUTE;
}
if ( process.env.HOUR ) {
  resetTime.hour = process.env.HOUR;
}
if ( process.env.DAY_OF_WEEK ) {
  resetTime.dayOfWeek = process.env.DAY_OF_WEEK;
}
setSchedule( resetTime );

/* Function that is invoked upon a HTTP request */
exports.processRequest = (req, res) => {
  if ( req.method !== 'POST' ) {
    res.status(403).send('Forbidden!');
  }
  let address = getAddressFromRequest( req );
  if ( hasAddress( address ) ) {
    return res.status(403).send('Thank you for your enthusiasm, but we have already received a submission from you.\nIf you want to skip the wait, then join us on Discord at: https://discord.gg/VuZhs9V');
  }

  let data = req.body;
  if ( validateData( data ) ) {
    let msg = composeEmail( data );
    if ( msg !== null ) {
      sgMail.send( msg )
        .then(result => {
        if ( msg.mailSettings.sandbox_mode.enable ) {
          return res.status(200).send('Development Mode is enabled. Email proccessed but not sent.');
        }
        else {
          addressList.push( address );
        }
        return res.status(200).send('Thanks for sharing your interest in us! We will get back to you shortly.');
      })
      .catch(err => {
        return res.status(500).send('An error seems to have occurred. Please try again later.');
      });
    }
  }
  else {
    return res.status(400).send('Form submission is not valid. Please enter a valid email and try again.');
  }
};

/* Functions for ip monitoring */
function setSchedule( options ) {
  let rule = new schedule.RecurrenceRule();
  for ( let parameter in options ) {
    if ( rule.hasOwnProperty(parameter) ) {
      rule[parameter] = options[parameter];
    }
  }
  resetTask = schedule.scheduleJob(rule, () => {
      addressList.length = 0;
    });
}

function hasAddress( address ) {
  return addressList.indexOf( address ) > -1;
}

function getAddressFromRequest( req ) {
  return ( req.headers['x-forwarded-for'] || req.connection.remoteAddress || '' ).split(',')[0].trim();
}

/* Functions for Request Handling */
function composeEmail( data ) {
  let subject = "Interested in contributing to Hourai Teahouse?";
  let email = injectData( data, htmlString );
  let msg = {
    to: data.email,
    from: process.env.EMAIL,
    subject: subject,
    html: email,
    mailSettings: {
      sandbox_mode: {
        enable: devMode
      }
    }
  };
  if ( process.env.BCC ) {
    msg.bcc = process.env.BCC;
  }
  for ( let prop in msg ) {
    if ( msg.hasOwnProperty(prop) && !msg[prop] ) {
      return null;
    }
  }
  return msg;
}

function injectData( data, htmlString ) {
    for ( let param in data ) {
      let index = htmlString.indexOf('id="' + param + '"');
      if ( index > -1 ) {
        let tagPos = htmlString.indexOf('>', index );
        if ( tagPos > -1 ) {
          htmlString = [htmlString.slice(0, tagPos + 1), data[param], htmlString.slice(tagPos + 1)].join('');
        }
      }
    }
    return htmlString;
}

function validateData( data ) {
    return /^.+@.+\..+$/.test(data.email);
}
