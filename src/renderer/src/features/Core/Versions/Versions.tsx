import { useState } from 'react'

function Versions(): JSX.Element {
  // @ts-ignore - window.electron might not have process exposed yet in types
  const [versions] = useState((window as any).electron?.process?.versions || {})

  return (
    <ul className="versions">
      <li className="electron-version">Electron v{versions.electron}</li>
      <li className="chrome-version">Chromium v{versions.chrome}</li>
      <li className="node-version">Node v{versions.node}</li>
    </ul>
  )
}

export default Versions
