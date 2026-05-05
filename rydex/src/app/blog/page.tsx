import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export default function BlogPage() {
  const posts = [
    {
      title: "The Future of Urban Mobility",
      date: "May 1, 2024",
      excerpt: "How bike taxis are changing the way we navigate crowded cities."
    },
    {
      title: "Moving Tips: Stress-Free Relocation",
      date: "April 15, 2024",
      excerpt: "Everything you need to know about booking the right truck for your move."
    }
  ];

  return (
    <div className="w-full min-h-screen flex flex-col bg-white">
      <Nav />
      <main className="flex-grow pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-12 text-center">RYDEX Blog</h1>
          <div className="grid gap-12">
            {posts.map((post, i) => (
              <div key={i} className="border-b border-gray-100 pb-12">
                <p className="text-sm text-blue-600 font-semibold mb-2">{post.date}</p>
                <h2 className="text-2xl font-bold mb-4 hover:text-blue-600 cursor-pointer transition">
                  {post.title}
                </h2>
                <p className="text-gray-600 mb-6">{post.excerpt}</p>
                <button className="text-sm font-bold flex items-center gap-2 group">
                  Read More <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
