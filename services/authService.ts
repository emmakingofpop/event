
import { PhoneAuthProvider } from "firebase/auth";
import { auth } from "./firebaseConfig";

export   const sendVerification = async (phoneNumber:string,recaptchaVerifier:any) => {
    try {
      const phoneProvider = new PhoneAuthProvider(auth);
      const id = await phoneProvider.verifyPhoneNumber(
        phoneNumber,
        recaptchaVerifier.current!
      );
      return id
    } catch (err: any) {
      return null
    }
  };
