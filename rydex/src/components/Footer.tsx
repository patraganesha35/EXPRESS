"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Mail,
  CheckCircle2,
} from "lucide-react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    // Simulate API call
    console.log("Subscribing email:", email);
    setSubscribed(true);
    setEmail("");
    
    // Reset success message after 3 seconds
    setTimeout(() => setSubscribed(false), 3000);
  };

  const footerLinks = {
    COMPANY: [
      { name: "About", href: "/about" },
      { name: "Careers", href: "/careers" },
      { name: "Blog", href: "/blog" },
      { name: "Contact", href: "/contact" },
    ],
    SERVICES: [
      { name: "Bike Rental", href: "/fleet" },
      { name: "Car Rental", href: "/fleet" },
      { name: "SUV & Van", href: "/fleet" },
      { name: "Truck Booking", href: "/fleet" },
    ],
    PARTNERS: [
      { name: "Become a Partner", href: "/partner/onboard/vehicle" },
      { name: "Partner Portal", href: "/partner" },
      { name: "Safety", href: "/faq" },
    ]
  };

  return (
    <footer className="w-full bg-black text-white">
      {/* TOP SECTION */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto px-6 py-16"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-12">

          {/* BRAND */}
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-bold tracking-wide">RYDEX</h2>
            <p className="mt-4 text-gray-400 text-sm leading-relaxed">
              Book any vehicle — from bikes to trucks.  
              Trusted owners. Transparent pricing.
            </p>

            {/* SOCIAL */}
            <div className="flex gap-4 mt-6">
              {[Facebook, Instagram, Twitter, Linkedin].map((Icon, i) => (
                <motion.a
                  key={i}
                  whileHover={{ y: -3 }}
                  href="#"
                  className="w-10 h-10 flex items-center justify-center rounded-full border border-white/20 hover:bg-white hover:text-black transition"
                >
                  <Icon size={18} />
                </motion.a>
              ))}
            </div>
          </div>

          {/* COMPANY LINKS */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider text-gray-300">
              COMPANY
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              {footerLinks.COMPANY.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-gray-400 hover:text-white transition"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* SERVICES LINKS */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider text-gray-300">
              SERVICES
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              {footerLinks.SERVICES.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-gray-400 hover:text-white transition"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* PARTNER LINKS */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider text-gray-300">
              PARTNERS
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              {footerLinks.PARTNERS.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-gray-400 hover:text-white transition"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* NEWSLETTER */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider text-gray-300">
              STAY UPDATED
            </h3>
            <p className="mt-4 text-gray-400 text-sm">
              Subscribe for updates & offers.
            </p>

            <form onSubmit={handleSubscribe} className="mt-4 flex flex-col gap-2">
              <div className="flex">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email"
                  required
                  className="flex-1 bg-black border border-white/20 rounded-l-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-white/40 transition"
                />
                <button 
                  type="submit"
                  className="px-4 py-2 bg-white text-black rounded-r-lg hover:bg-gray-200 transition flex items-center justify-center"
                >
                  {subscribed ? <CheckCircle2 size={16} className="text-green-600" /> : <Mail size={16} />}
                </button>
              </div>
              {subscribed && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[10px] text-green-400 font-medium"
                >
                  Thank you for subscribing!
                </motion.p>
              )}
            </form>
          </div>
        </div>
      </motion.div>

      {/* BOTTOM BAR */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 gap-4">
          <p>© {new Date().getFullYear()} RYDEX. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/faq" className="hover:text-white transition">
              Privacy Policy
            </Link>
            <Link href="/faq" className="hover:text-white transition">
              Terms
            </Link>
            <Link href="/faq" className="hover:text-white transition">
              Legal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
