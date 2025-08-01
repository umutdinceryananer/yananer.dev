import { useState } from 'react'
import EmailPopup from '../EmailPopup'
import profilePhoto from '../../assets/umut-foto.jpg'

const AboutMe = () => {
  const [isEmailPopupOpen, setIsEmailPopupOpen] = useState(false)

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex items-start gap-6">
        <div className="w-32 h-40 rounded-xl overflow-hidden flex-shrink-0">
          <img
            src={profilePhoto}
            alt="Umut Dinçer Yananer"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-2 px-2 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-indigo-400 text-sm font-manrope">Always Around</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white font-manrope">Umut Dinçer Yananer</h2>
          <p className="text-indigo-400 text-lg">CTIS Graduate from Bilkent University</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="bg-[#141414] rounded-xl p-4 border border-gray-800 mb-4">
          <h3 className="text-xl font-semibold text-white mb-3 font-manrope">About Me</h3>
          <p className="text-gray-300 text-sm leading-relaxed">
            Solution-oriented professional with AWS Cloud Practitioner certification,
            passionate about learning, problem-solving, and delivering impactful solutions.
          </p>
        </div>
        <div className="bg-[#141414] rounded-xl p-4 border border-gray-800">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button 
              onClick={() => setIsEmailPopupOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-lg transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-indigo-500/25 border border-indigo-400/50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </button>

            <a 
              href="https://www.linkedin.com/in/umut-yananer/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#1f1f1f] text-white rounded-lg transition-colors border border-indigo-500/30 hover:border-indigo-500/50"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>

            <a 
              href="https://github.com/umutdinceryananer"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#1f1f1f] text-white rounded-lg transition-colors border border-indigo-500/30 hover:border-indigo-500/50"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.239 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>

            <a 
              href="https://stackoverflow.com/users/14721871/umut"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#1f1f1f] text-white rounded-lg transition-colors border border-indigo-500/30 hover:border-indigo-500/50"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.986 21.865v-6.404h2.134V24H1.844v-8.539h2.13v6.404h15.012zM6.111 19.731H16.85v-2.137H6.111v2.137zm.259-4.852l10.48 2.189.451-2.07-10.478-2.187-.453 2.068zm1.359-5.056l9.705 4.53.903-1.95-9.706-4.53-.902 1.95zm2.715-4.785l8.217 6.855 1.359-1.62-8.216-6.853-1.36 1.618zM15.751 0l-1.746 1.294 6.405 8.604 1.746-1.294L15.749 0z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

      <EmailPopup 
        isOpen={isEmailPopupOpen}
        onClose={() => setIsEmailPopupOpen(false)}
      />
    </div>
  )
}

export default AboutMe
