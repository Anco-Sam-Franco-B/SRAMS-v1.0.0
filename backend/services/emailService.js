import transporter from "../config/mail.js";
import { loadEmailTemplate } from "../utils/emailTemplate.js";


export async function sendEmail({
to,
subject,
template,
data
}){

const html =
await loadEmailTemplate(
    template,
    data
);

await transporter.sendMail({
from:
process.env.SMTP_FROM,
to,
subject,
html
});


}