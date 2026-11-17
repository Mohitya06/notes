import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center px-6">
      <div className="max-w-2xl text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-600/10 border border-violet-600/20 rounded-full text-violet-400 text-xs font-medium mb-8">
          ⚡ Real-time collaboration
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-5 leading-tight">
          Notes that think
          <br />
          <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
            together.
          </span>
        </h1>

        <p className="text-gray-400 text-lg mb-10 leading-relaxed">
          Create workspaces, build nested pages, and collaborate with your team
          in real-time. See every change as it happens.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/auth/register" className="btn-primary text-sm px-6 py-3">
            Get started free
          </Link>
          <Link
            href="/auth/login"
            className="btn text-sm px-6 py-3 border border-[#2a2a2a] text-gray-300 hover:border-violet-600 hover:text-white"
          >
            Sign in
          </Link>
        </div>

        <div className="mt-20 grid grid-cols-3 gap-6 text-left">
          {[
            { icon: '⚡', title: 'Real-time sync', desc: 'WebSocket-powered edits appear instantly for all collaborators.' },
            { icon: '🧱', title: 'Block editor', desc: 'Headings, lists, code blocks, quotes — full rich text support.' },
            { icon: '👥', title: 'Live presence', desc: 'See who\'s online and where their cursor is in the document.' },
          ].map((f) => (
            <div key={f.title} className="card">
              <span className="text-2xl mb-3 block">{f.icon}</span>
              <h3 className="text-white font-semibold mb-1 text-sm">{f.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
