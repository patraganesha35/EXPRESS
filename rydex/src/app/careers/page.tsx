import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export default function CareersPage() {
  return (
    <div className="w-full min-h-screen flex flex-col bg-white">
      <Nav />
      <main className="flex-grow pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold mb-8">Join the RYDEX Team</h1>
          <p className="text-xl text-gray-600 mb-12">
            We're building the future of transportation and we need your help.
          </p>
          <div className="bg-gray-50 rounded-3xl p-12">
            <h2 className="text-2xl font-bold mb-4">No Openings Currently</h2>
            <p className="text-gray-500">
              We're not currently hiring, but we're always looking for talented individuals. 
              Check back later or follow us on LinkedIn for updates.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
