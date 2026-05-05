import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <div className="w-full min-h-screen flex flex-col bg-white">
      <Nav />
      <main className="flex-grow pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-8">About RYDEX</h1>
          <p className="text-lg text-gray-600 mb-6">
            RYDEX is your all-in-one vehicle booking platform. From quick bike rides to heavy-duty trucks, we connect you with reliable vehicle owners across the country.
          </p>
          <p className="text-lg text-gray-600 mb-6">
            Our mission is to make transportation seamless, transparent, and accessible for everyone. Whether you're moving house or just moving through traffic, RYDEX is here to help.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
