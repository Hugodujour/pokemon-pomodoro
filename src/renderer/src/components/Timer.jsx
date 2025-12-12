import { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'

export default function Timer({ onFinish, onTick }) {
  const DURATION = 25 * 60
  const [remaining, setRemaining] = useState(DURATION)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef(null)

  const remainingRef = useRef(remaining)

  useEffect(() => {
    remainingRef.current = remaining
  }, [remaining])

  useEffect(() => {
    if (running) {
      // Interval principal pour le timer
      intervalRef.current = setInterval(() => {
        const current = remainingRef.current
        if (current <= 1) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
          setRunning(false)
          setRemaining(0)
          if (onFinish) onFinish()
        } else {
          if (onTick) onTick(1)
          setRemaining((prev) => prev - 1)
        }
      }, 1000)
    }

    return () => {
      clearInterval(intervalRef.current)
    }
  }, [running, onFinish, onTick])

  const minutes = String(Math.floor(remaining / 60)).padStart(2, '0')
  const seconds = String(remaining % 60).padStart(2, '0')
  const percent = (1 - remaining / DURATION) * 100

  return (
    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
      <h1 style={{ fontSize: '3rem' }}>
        {minutes}:{seconds}
      </h1>

      {/* barre du timer */}
      <div
        style={{
          width: '220px',
          height: '10px',
          background: '#222',
          margin: '10px auto',
          borderRadius: '6px',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            width: percent + '%',
            height: '100%',
            background: 'orange',
            transition: 'width 0.3s linear'
          }}
        />
      </div>

      <div style={{ marginTop: '1rem' }}>
        <button onClick={() => setRunning(true)}>Start</button>
        <button onClick={() => setRunning(false)}>Pause</button>
        <button
          onClick={() => {
            setRunning(false)
            setRemaining(DURATION)
          }}
        >
          Reset
        </button>
      </div>
    </div>
  )
}

Timer.propTypes = {
  onFinish: PropTypes.func,
  onTick: PropTypes.func
}
