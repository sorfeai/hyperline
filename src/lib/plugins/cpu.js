import React from 'react'
import Component from 'hyper/component'
import { currentLoad as cpuLoad, cpuTemperature } from 'systeminformation'
import leftPad from 'left-pad'
import SvgIcon from '../utils/svg-icon'

class PluginIcon extends Component {
  render() {
    return (
      <SvgIcon>
        <g fill="none" fillRule="evenodd">
          <g
            className='cpu-icon'
            transform="translate(1.000000, 1.000000)"
          >
            <g>
              <path d="M3,3 L11,3 L11,11 L3,11 L3,3 Z M4,4 L10,4 L10,10 L4,10 L4,4 Z" />
              <rect x="5" y="5" width="4" height="4" />
              <rect x="4" y="0" width="1" height="2" />
              <rect x="6" y="0" width="1" height="2" />
              <rect x="8" y="0" width="1" height="2" />
              <rect x="5" y="12" width="1" height="2" />
              <rect x="7" y="12" width="1" height="2" />
              <rect x="9" y="12" width="1" height="2" />
              <rect x="12" y="3" width="2" height="1" />
              <rect x="12" y="5" width="2" height="1" />
              <rect x="12" y="7" width="2" height="1" />
              <rect x="12" y="9" width="2" height="1" />
              <rect x="0" y="4" width="2" height="1" />
              <rect x="0" y="4" width="2" height="1" />
              <rect x="0" y="6" width="2" height="1" />
              <rect x="0" y="8" width="2" height="1" />
              <rect x="0" y="10" width="2" height="1" />
            </g>
          </g>
        </g>

        <style jsx>{`
          .cpu-icon {
            fill: #fff;
          }
        `}</style>
      </SvgIcon>
    )
  }
}

export default class Cpu extends Component {
  static displayName() {
    return 'cpu'
  }

  constructor(props) {
    super(props)

    this.state = {
      cpuLoad: 0,
      cpuTemperature: 0,
    }
  }

  getCpuInfo() {
    cpuLoad().then(({ currentload }) =>
      this.setState({
        cpuLoad: Math.ceil(currentload)
      })
    );
    cpuTemperature().then(({ main }) =>
      this.setState({
        cpuTemperature: main,
      })
    );
  }

  componentDidMount() {
    this.getCpuInfo()
    this.interval = setInterval(() => this.getCpuInfo(), 2500)
  }

  componentWillUnmount() {
    clearInterval(this.interval)
  }

  render() {
    const { cpuLoad, cpuTemperature } = this.state;
    return (
      <div className='wrapper'>
        <PluginIcon /> {`${cpuLoad}% (${cpuTemperature}°)`}

        <style jsx>{`
          .wrapper {
            display: flex;
            align-items: center;
          }
        `}</style>
      </div>
    )
  }
}
