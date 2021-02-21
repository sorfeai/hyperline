import React from 'react'
import Component from 'hyper/component'
import cp from 'child_process'
import util from 'util'
import SvgIcon from '../../utils/svg-icon';

const exec = util.promisify(cp.exec)

class TrashIcon extends Component {
  render() {
    return (
      <SvgIcon {...this.props}>
        <g fillRule="evenodd">
          <g className="trash-icon">
            <path d="m156.371094 30.90625h85.570312v14.398438h30.902344v-16.414063c.003906-15.929687-12.949219-28.890625-28.871094-28.890625h-89.632812c-15.921875 0-28.875 12.960938-28.875 28.890625v16.414063h30.90625zm0 0"/><path d="m344.210938 167.75h-290.109376c-7.949218 0-14.207031 6.78125-13.566406 14.707031l24.253906 299.90625c1.351563 16.742188 15.316407 29.636719 32.09375 29.636719h204.542969c16.777344 0 30.742188-12.894531 32.09375-29.640625l24.253907-299.902344c.644531-7.925781-5.613282-14.707031-13.5625-14.707031zm-219.863282 312.261719c-.324218.019531-.648437.03125-.96875.03125-8.101562 0-14.902344-6.308594-15.40625-14.503907l-15.199218-246.207031c-.523438-8.519531 5.957031-15.851562 14.472656-16.375 8.488281-.515625 15.851562 5.949219 16.375 14.472657l15.195312 246.207031c.527344 8.519531-5.953125 15.847656-14.46875 16.375zm90.433594-15.421875c0 8.53125-6.917969 15.449218-15.453125 15.449218s-15.453125-6.917968-15.453125-15.449218v-246.210938c0-8.535156 6.917969-15.453125 15.453125-15.453125 8.53125 0 15.453125 6.917969 15.453125 15.453125zm90.757812-245.300782-14.511718 246.207032c-.480469 8.210937-7.292969 14.542968-15.410156 14.542968-.304688 0-.613282-.007812-.921876-.023437-8.519531-.503906-15.019531-7.816406-14.515624-16.335937l14.507812-246.210938c.5-8.519531 7.789062-15.019531 16.332031-14.515625 8.519531.5 15.019531 7.816406 14.519531 16.335937zm0 0"/><path d="m397.648438 120.0625-10.148438-30.421875c-2.675781-8.019531-10.183594-13.429687-18.640625-13.429687h-339.410156c-8.453125 0-15.964844 5.410156-18.636719 13.429687l-10.148438 30.421875c-1.957031 5.867188.589844 11.851562 5.34375 14.835938 1.9375 1.214843 4.230469 1.945312 6.75 1.945312h372.796876c2.519531 0 4.816406-.730469 6.75-1.949219 4.753906-2.984375 7.300781-8.96875 5.34375-14.832031zm0 0"/>
          </g>
        </g>

        <style jsx>{`
          .trash-icon {
            fill: #fff;
            transform: scale(0.028) translateX(150px);
          }
        `}</style>
      </SvgIcon>
    )
  }
}

export default class CurrencyRate extends Component {
  static displayName() {
    return 'trash'
  }

  constructor() {
    super();
    this.state = {
      filesCount: 0,
      showConfirmClear: false
    };
  }

  componentDidMount() {
    this.interval = setInterval(() => {
      this.updateTrashCount()
    }, 1000)
  }

  componentWillUnmount() {
    if (this.interval) {
      clearInterval(this.interval)
    }
  }

  updateTrashCount() {
    const { trashDir } = this.props.options
    exec(`find ${trashDir} -type f | wc -l`).then(({ stdout, stderr }) => {
      this.setState({ filesCount: stdout })
    })
  }

  onMouseDown(ev) {
    const { filesCount } = this.state
    if (ev.button === 0) {
      const { trashDir, fileManager } = this.props.options
      exec(`${fileManager} ${trashDir}`)
    } else if (ev.button === 1 && filesCount > 0) {
      this.setState((state) => ({ showConfirmClear: !state.showConfirmClear }))
    }
  }

  clearTrash() {
    const { trashDir } = this.props.options
    exec(`rm -rf ${trashDir}/*`).then(() => {
      this.setState({ showConfirmClear: false })
    })
  }

  render() {
    const { filesCount, showConfirmClear } = this.state;
    return (
      <div className="wrapper" onMouseDown={(ev) => this.onMouseDown(ev)}>
        <TrashIcon />
        {filesCount}
        {showConfirmClear ? (
          <div className="popup" onMouseDown={(ev) => ev.stopPropagation()}>
            <span>{`Are you sure you want to delete ${filesCount} file(s)?`}</span>
            <div className="popup-buttons">
              <div className="popup-button" onClick={() => this.clearTrash()}>Yes</div>
              <div className="popup-button" onClick={() => this.setState({ showConfirmClear: false })}>No</div>
            </div>
          </div>
        ) : null}

        <style jsx>{`
          .wrapper {
            position: relative;
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
          }
          .popup-buttons {
            display: flex;
            margin-top: 10px;
            color: #1ED760;
          }
          .popup-button {
            cursor: pointer;
            text-decoration: underline;
          }
          .popup-button:first-child {
            margin-right: 20px;
          }
          .popup-button:hover {
            text-decoration: none;
          }
        `}</style>
      </div>
    );
  }
}
