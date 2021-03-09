import React from 'react'
import Component from 'hyper/component'

export class FloatingText extends Component {
  constructor() {
    super()
    this.textRef = null
    this.wrapperRef = null
    this.textWidth = null
    this.wrapperWidth = null
    this.spacing = 50

    this.onTransitionEnd = this.onTransitionEnd.bind(this)
  }

  componentDidMount() {
    if (this.textRef && this.wrapperRef) {
      this.init()
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.text !== prevProps.text) {
      this.clearFloating()
      this.init()
    }
  }

  init() {
    this.textWidth = this.textRef.offsetWidth
    this.wrapperWidth = this.wrapperRef.offsetWidth
    this.isFloating = this.textWidth > this.wrapperWidth
    if (this.isFloating) {
      this.startFloating()
      this.forceUpdate()
    }
  }

  clearFloating() {
    this.textRef.style.transitionDuration = '0ms'
    this.textRef.style.marginLeft = 0
  }

  startFloating() {
    this.textRef.style.transitionDuration = `${this.textWidth * 50}ms`
    this.textRef.style.marginLeft = `-${this.textWidth + this.spacing}px`
  }

  onTransitionEnd() {
    this.clearFloating()
    setTimeout(() => {
      this.startFloating()
    }, 2000)
  }

  render() {
    const { text, width = '100%' } = this.props

    return (
      <div>
        <div className="title-wrapper" ref={(ref) => this.wrapperRef = ref}>
          <div className="title-1"
               ref={(ref) => this.textRef = ref}
               onTransitionEnd={this.onTransitionEnd}>
            {text}
          </div>
          {this.isFloating ? (
            <div className="title-2">{text}</div>
          ) : null}
        </div>

        <style jsx>{`
          .title-wrapper {
            display: flex;
            width: ${width};
            overflow: hidden;
          }
          .title-1 {
            margin-right: ${this.spacing}px;
            transition-property: margin-left;
            transition-timing-function: linear;
          }
        `}</style>
      </div>
    )
  }
}
