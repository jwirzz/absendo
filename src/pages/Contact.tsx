
import Navbar from "../components/Navbar.tsx";
import ContactForm from "../components/ContactForm.tsx";
import Footer from "../components/Footer.tsx";

function Contact () {
    return (
        <div className={"min-h-screen bg-base-100 flex flex-col"}>
            <Navbar />
            <main className="flex-1">
                <ContactForm />
            </main>
            <Footer />
        </div>
    );
}
export default Contact;
