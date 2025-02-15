import React from 'react'

type Props = {}

const Sidebar = (props: Props) => {
  return (
    <div className="max-w-1/4 w-[200px] h-screen bg-gray-700 text-white p-5 border-r shadow-xl">
      <h2 className="text-xl font-bold">Sidebar</h2>
      <ul className="mt-4 space-y-3">
        <li>
          <a href="/" className="block p-2 hover:bg-gray-600 rounded">
            Dashboard
          </a>
        </li>
        <li>
          <a href="/settings" className="block p-2 hover:bg-gray-600 rounded">
            Settings
          </a>
        </li>
        <li>
          <a href="/create" className="block p-2 hover:bg-gray-600 rounded">
            Create a Project
          </a>
        </li>
      </ul>
    </div>
  )
}

export default Sidebar
