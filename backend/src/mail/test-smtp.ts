import "dotenv/config";
import {transporter} from "./smtp.js";

try {
    await transporter.verify();
    console.log("Ethereal SMTP connection successfull");
}
catch(error) {
    console.error(" SMTP connection failed:",error);
}