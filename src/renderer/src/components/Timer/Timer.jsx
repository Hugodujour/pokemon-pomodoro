import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import PropTypes from 'prop-types'
import './Timer.css'

const Timer = forwardRef(({ onFinish, onTick, onStart }, ref) => {
  const DURATION = 0.1 * 60
  const [remaining, setRemaining] = useState(DURATION)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef(null)

  const remainingRef = useRef(remaining)

  useImperativeHandle(ref, () => ({
    start: () => setRunning(true),
    pause: () => setRunning(false),
    reset: (autoStart = false) => {
        setRunning(false)
        setRemaining(DURATION)
        if (autoStart) {
            // Tiny timeout to ensure state update if needed, or just set true
            setTimeout(() => setRunning(true), 0)
        }
    }
  }))

  useEffect(() => {
    remainingRef.current = remaining
  }, [remaining])

  useEffect(() => {
    if (running) {
      if (onStart) onStart()  // Notify start
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
  }, [running, onFinish, onTick, onStart])

  const minutes = String(Math.floor(remaining / 60)).padStart(2, '0')
  const seconds = String(remaining % 60).padStart(2, '0')
  const percent = (1 - remaining / DURATION) * 100

  return (
    <div className="timer-container">
      <h1 className="timer-display">
        {minutes}:{seconds}
      </h1>

      {/* barre du timer */}
      <div className="timer-bar-container">
        <div
          className="timer-bar-fill"
          style={{
            width: percent + '%',
          }}
        />
      </div>


    </div>
  )
})

Timer.displayName = 'Timer'

Timer.propTypes = {
  onFinish: PropTypes.func,
  onTick: PropTypes.func,
  onStart: PropTypes.func
}

export default Timer
