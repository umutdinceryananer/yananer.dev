import AboutMe from '../components/grids/AboutMe'
import Education from '../components/grids/Education'
import TechStack from '../components/grids/TechStack'
import WorkExperience from '../components/grids/WorkExperience'
import ResumeChat from '../components/grids/BlogCTA'
import Header from '../components/Header'
import Footer from '../components/Footer'

const Home = () => {
  return (
    <div className="min-h-screen w-full bg-[#0F0F0F] flex flex-col items-center overflow-x-hidden">
      <Header />
      <div className="w-full max-w-[1400px] px-2 sm:px-4 lg:px-8 pt-32 pb-6 sm:pb-8">
        <div className="grid grid-cols-1 min-[745px]:grid-cols-2 min-[1240px]:grid-cols-[1.2fr_1.4fr_1.2fr] gap-3 sm:gap-4 lg:gap-6">
          {/* Left Column - AboutMe and Education */}
          <div className="min-[745px]:row-span-2 bg-[#141414] rounded-lg sm:rounded-xl p-[2px] shadow-[0_0_15px_rgba(0,0,0,0.6)] hover:shadow-[0_0_20px_rgba(0,0,0,0.7)] transition-shadow">
            <div className="h-full w-full bg-[#141414] rounded-[10px] p-4 sm:p-6 lg:p-7">
              <AboutMe />
            </div>
          </div>
          <div className="bg-[#141414] rounded-lg sm:rounded-xl p-[2px] shadow-[0_0_15px_rgba(0,0,0,0.6)] hover:shadow-[0_0_20px_rgba(0,0,0,0.7)] transition-shadow">
            <div className="h-full w-full bg-[#141414] rounded-[10px] p-4 sm:p-6 lg:p-7">
              <Education />
            </div>
          </div>

          {/* Blog CTA */}
          <div className="min-[1240px]:col-start-3 min-[1240px]:row-start-1 min-[745px]:order-3 min-[1240px]:order-none bg-[#141414] rounded-lg sm:rounded-xl p-[2px] shadow-[0_0_15px_rgba(0,0,0,0.6)] hover:shadow-[0_0_20px_rgba(0,0,0,0.7)] transition-shadow">
            <div className="h-full w-full bg-[#141414] rounded-[10px] p-4 sm:p-6 lg:p-7">
              <ResumeChat />
            </div>
          </div>

          {/* Middle Column - Work Experience (Full Height) */}
          <div className="min-[745px]:col-span-2 min-[1240px]:col-span-1 min-[1240px]:col-start-2 min-[1240px]:row-start-1 min-[1240px]:row-span-3 min-[745px]:order-4 min-[1240px]:order-none bg-[#141414] rounded-lg sm:rounded-xl p-[2px] shadow-[0_0_15px_rgba(0,0,0,0.6)] hover:shadow-[0_0_20px_rgba(0,0,0,0.7)] transition-shadow">
            <div className="h-full w-full bg-[#141414] rounded-[10px] p-4 sm:p-6 lg:p-7 min-h-[600px] min-[1240px]:min-h-0">
              <WorkExperience />
            </div>
          </div>

          {/* Tech Stack */}
          <div className="min-[745px]:col-span-2 min-[1240px]:col-span-1 min-[1240px]:col-start-3 min-[1240px]:row-start-2 min-[1240px]:row-span-2 min-[745px]:order-5 min-[1240px]:order-none bg-[#141414] rounded-lg sm:rounded-xl p-[2px] shadow-[0_0_15px_rgba(0,0,0,0.6)] hover:shadow-[0_0_20px_rgba(0,0,0,0.7)] transition-shadow">
            <div className="h-full w-full bg-[#141414] rounded-[10px] p-4 sm:p-6 lg:p-7 min-h-[400px] min-[1240px]:min-h-0">
              <TechStack />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default Home 