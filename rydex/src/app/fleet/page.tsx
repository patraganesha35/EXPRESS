import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import VehicleCategoriesSlider from "@/components/VehicleCategoriesSlider";
import { Bike, Car, Truck } from "lucide-react";

export default function FleetPage() {
  return (
    <div className="w-full min-h-screen flex flex-col bg-white">
      <Nav />
      <main className="flex-grow pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center mb-12">
          <span className="inline-block text-sm font-semibold tracking-widest uppercase text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full mb-4">
            Our Fleet
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-6">
            Vehicles for Every Need
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            Whether you need a quick bike ride through traffic, a comfortable car for the family, or a truck for heavy goods—we have you covered.
          </p>
        </div>

        <VehicleCategoriesSlider />

        {/* Feature grid */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 mt-20 grid md:grid-cols-3 gap-8">
          {[
            {
              title: "Quick Commutes",
              desc: "Beat the traffic with our fast and affordable bike taxis.",
              icon: <Bike size={24} />,
              color: "text-blue-600 bg-blue-50"
            },
            {
              title: "Comfortable Rides",
              desc: "Premium sedans and hatchbacks for your city travel.",
              icon: <Car size={24} />,
              color: "text-emerald-600 bg-emerald-50"
            },
            {
              title: "Goods Delivery",
              desc: "Loading autos and trucks for all your shifting needs.",
              icon: <Truck size={24} />,
              color: "text-violet-600 bg-violet-50"
            }
          ].map((feature, i) => (
            <div key={i} className="bg-gray-50 rounded-3xl p-8 text-center">
              <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-6 ${feature.color}`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
