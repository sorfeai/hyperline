import React from 'react'
import Component from 'hyper/component'
import { mem as memoryData } from 'systeminformation'
import util from 'util'
import cp from 'child_process'
import SvgIcon from '../utils/svg-icon'

const exec = util.promisify(cp.exec)

class PluginIcon extends Component {
  render() {
    return (
      <SvgIcon>
        <g fill="none" fillRule="evenodd">
          <g className='memory-icon'>
            <g id="memory" transform="translate(1.000000, 1.000000)">
              <path d="M3,0 L11,0 L11,14 L3,14 L3,0 Z M4,1 L10,1 L10,13 L4,13 L4,1 Z" />
              <rect x="5" y="2" width="4" height="10" />
              <rect x="12" y="1" width="2" height="1" />
              <rect x="12" y="3" width="2" height="1" />
              <rect x="12" y="5" width="2" height="1" />
              <rect x="12" y="9" width="2" height="1" />
              <rect x="12" y="7" width="2" height="1" />
              <rect x="12" y="11" width="2" height="1" />
              <rect x="0" y="1" width="2" height="1" />
              <rect x="0" y="3" width="2" height="1" />
              <rect x="0" y="5" width="2" height="1" />
              <rect x="0" y="9" width="2" height="1" />
              <rect x="0" y="7" width="2" height="1" />
              <rect x="0" y="11" width="2" height="1" />
            </g>
          </g>
        </g>

        <style jsx>{`
          .memory-icon {
            fill: #fff;
          }
        `}</style>

      </SvgIcon>
    )
  }
}

export default class Memory extends Component {
  static displayName() {
    return 'memory'
  }

  constructor(props) {
    super(props)

    this.state = {
      activeMemory: 0,
      totalMemory: 0,
      programs: null,
      showPrograms: false
    }

    this.getMemory = this.getMemory.bind(this)
    this.getPrograms = this.getPrograms.bind(this)
    this.onMouseDown = this.onMouseDown.bind(this)
  }

  componentDidMount() {
    this.getMemory()
    this.getPrograms()
    this.interval = setInterval(() => {
      this.getMemory()
      this.getPrograms()
    }, 2500)
  }

  componentWillUnmount() {
    clearInterval(this.interval)
  }

  getMemory() {
    return memoryData().then(memory => {
      this.setState({
        activeMemory: this.getGb(memory.active),
        totalMemory: this.getGb(memory.total)
      })
    })
  }

  getPrograms() {
    exec(`
      ps -A --sort -rss -o comm,pmem,rss | awk '
      NR == 1 { print; next }
      { a[$1] += $2; b[$1] += $3; }
      END {
        for (i in a) {
          size_in_bytes = b[i] * 1024
          split("B KB MB GB TB PB", unit)
          human_readable = 0
          if (size_in_bytes == 0) {
            human_readable = 0
            j = 0
          }
          else {
            for (j = 5; human_readable < 1; j--)
              human_readable = size_in_bytes / (2^(10*j))
          }
          printf "%-20s\\t%s\\t%.1f%s\\t%s\\n", i, a[i], human_readable, unit[j+2], b[i]
        }
      }
      ' | awk 'NR>1' | sort -rnk4 | awk '
      BEGIN {printf "%-20s\\t%%MEM\\tSIZE\\n", "COMMAND"}
      {
        printf "%-20s\\t%s\\t%s\\n", $1, $2, $3
      }
      ' | less | head -n 15
    `).then(({ stdout }) => {
      this.setState({
        programs: stdout.split('\n').slice(1).map((line) => {
          const [name, percent, memory] = line.replace(/\s+/g, ' ').split(' ')
          return { name, percent, memory }
        }).filter((program) => program.name && program.memory)
      })
    })
  }

  getGb(bytes) {
    return (bytes / (1024 * 1024 * 1024)).toFixed(1)
  }

  onMouseDown(ev) {
    if (ev.button === 1) {
      this.setState((state) => ({ showPrograms: !state.showPrograms }))
    }
  }

  render() {
    const { showPrograms, programs } = this.state

    return (
      <div className="wrapper" onMouseDown={this.onMouseDown}>
        <PluginIcon /> {this.state.activeMemory}G
        {(showPrograms && programs) ? (
          <div className="popup" onMouseDown={(ev) => ev.stopPropagation()}>
            {programs.map((line) => (
              <div className="program">
                <div className="program-name">{line.name}</div>
                <div className="program-percent">{line.percent}%</div>
                <div className="program-memory">{line.memory}</div>
              </div>
            ))}
          </div>
        ) : null}

        <style jsx>{`
          .wrapper {
            display: flex;
            align-items: center;
          }
          .popup {
            position: absolute;
            bottom: 24px;
            width: 200px;
            padding: 6px;
            border: 1px solid #1ED760;
            background: rgba(0,0,0,.75);
            box-sizing: border-box;
          }
          .program {
            display: flex;
            line-height: 1.5;
          }
          .program-name {
            margin-right: auto;
            color: #1ED760;
          }
          .program-memory {
            width: 40px;
            margin-left: 10px;
            text-align: right;
          }
        `}</style>
      </div>
    )
  }
}
