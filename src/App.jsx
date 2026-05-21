import { useEffect, useState } from 'react'

export default function App() {

  const [socket, setSocket] =
  useState(null)

  const [telemetry, setTelemetry] =
  useState({

    wifi:'--',
    brightness:'--',
    ip:'--'
  })

  useEffect(() => {

    const ws =
    new WebSocket(
      'ws://192.168.1.44:81'
    )

    ws.onmessage = (event) => {

      try {

        const data =
        JSON.parse(event.data)

        setTelemetry(data)

      } catch(e) {

        console.log(e)
      }
    }

    setSocket(ws)

    return () => ws.close()

  }, [])

  const send = (cmd) => {

    if(socket &&
       socket.readyState === 1){

      socket.send(cmd)
    }
  }

  return (

    <div style={{padding:20}}>

      <h1>AETHER OS</h1>

      <p>
        WiFi:
        {telemetry.wifi}
      </p>

      <p>
        Brightness:
        {telemetry.brightness}
      </p>

      <p>
        IP:
        {telemetry.ip}
      </p>

      <button
        style={{background:'#00ffff'}}
        onClick={()=>
          send('FX_RAINBOW')
        }
      >
        RAINBOW
      </button>

      <button
        style={{background:'#00ff66'}}
        onClick={()=>
          send('FX_MATRIX')
        }
      >
        MATRIX
      </button>

      <button
        style={{background:'#ff00ff'}}
        onClick={()=>
          send('FX_CYBER')
        }
      >
        CYBER
      </button>

      <button
        style={{background:'#ff3300'}}
        onClick={()=>
          send('FX_FIRE')
        }
      >
        FIRE
      </button>

      <button
        style={{background:'#666'}}
        onClick={()=>
          send('FX_OFF')
        }
      >
        OFF
      </button>

      <br/><br/>

      <input
        type="range"
        min="10"
        max="255"
        defaultValue="180"

        onChange={(e)=>

          send(
            'BRIGHTNESS:' +
            e.target.value
          )
        }
      />

    </div>
  )
}
