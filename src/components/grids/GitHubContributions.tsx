import { GitHubCalendar } from 'react-github-calendar'

const GitHubContributions = () => {
  return (
    <div className="h-full flex flex-col">
      <h3 className="text-xl font-semibold text-white mb-3 text-center font-manrope">GitHub Contributions</h3>
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gray-800 to-transparent mb-4" />
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <GitHubCalendar
          username="Automaticare"
          colorScheme="dark"
          blockSize={10}
          blockMargin={3}
          fontSize={12}
        />
      </div>
    </div>
  )
}

export default GitHubContributions
