import React from 'react'
import Component from 'hyper/component'
import util from 'util'
import cp from 'child_process'

const exec = util.promisify(cp.exec)

const USD_CURRENCY_ID = 'R01235'

export default class CurrencyRate extends Component {
  static displayName() {
    return 'currency'
  }

  constructor() {
    super();
    this.state = {
      today: null,
      diff: null,
      week: [],
      showWeek: false
    };
  }

  componentDidMount() {
    this.updateTodayRate()
    this.interval = setInterval(() => {
      this.updateTodayRate()
      this.updateWeekRates()
    }, 1000)
  }

  updateTodayRate() {
    Promise.all([
      exec(`echo $(curl -v http://www.cbr.ru/scripts/XML_daily.asp?date_req=$(date +%e/%m/%Y) 2>/dev/null) | \
            iconv -f cp1251 -t utf8 | sed -E "s/.*<CharCode>USD([^>]+>){6}([^,]*,[0-9]{2}).*/\\2/"`),
      exec(`echo $(curl -v http://www.cbr.ru/scripts/XML_daily.asp?date_req=$(date -d 'yesterday' +%e/%m/%Y) 2>/dev/null) | \
            iconv -f cp1251 -t utf8 | sed -E "s/.*<CharCode>USD([^>]+>){6}([^,]*,[0-9]{2}).*/\\2/"`)
    ]).then(([{ stdout: today }, { stdout: yesterday }]) => {
      const todayNum = this.formatFloat(today);
      const yesterdayNum = this.formatFloat(yesterday);
      const diff = todayNum - yesterdayNum
      this.setState({ today: todayNum, diff: diff.toFixed(2) })
    })
  }

  updateWeekRates() {
    exec(`curl -v "http://www.cbr.ru/scripts/XML_dynamic.asp?VAL_NM_RQ=R01235&date_req1=$(date -d '2 week ago' +%d/%m/%Y)&date_req2=$(date +%d/%m/%Y)" 2>/dev/null | \\
          xmllint --format - | \\
          awk -F'[<|>|"]' '/Record/{d=$3} /Value/{printf "%s;%s\\n",d,$3}'`)
      .then(({ stdout: rates }) => {
        const ratesLines = rates.split('\n')
        this.setState({
          week: ratesLines
            .filter(Boolean)
            .map((str, index) => {
              const [date, value] = str.split(';')
              const valueNum = parseFloat(value.replace(',', '.'))
              let diff
              if (index > 0) {
                const prevNum = parseFloat(ratesLines[index-1].split(';')[1].replace(',', '.'))
                diff = (valueNum - prevNum).toFixed(2)
              } else {
                diff = null
              }
              return { date, value: valueNum.toFixed(2), diff }
            })
        })
      })
  }

  formatFloat(value) {
    return parseFloat(value.replace(',', '.')).toFixed(2)
  }

  toggleWeek() {
    this.setState((state) => ({ showWeek: !state.showWeek }))
  }

  render() {
    const { today, diff, week, showWeek } = this.state
    if (today === 'NaN') return null;

    const renderDiff = (diff) => {
      if (diff === '0.00') return '＝'
      const sign = diff > 0 ? '▲' : '▼'
      const color = diff > 0 ? 'red' : '#1ED760'
      const displayDiff = diff ? diff.replace('-', '') : '...'
      return <span style={{ color }}>{`${sign}${displayDiff}`}</span>
    }

    return (
      <div className='wrapper' onClick={() => this.toggleWeek()}>
        <div>${today}&nbsp;{renderDiff(diff)}</div>
        {showWeek && week.length > 0 ? (
          <div className="popup" onClick={(ev) => ev.stopPropagation()}>
            {week.map((rate) =>
              <div className="rateRow">
                <span className="rateDate">{rate.date}</span> ---- <span>${rate.value} {renderDiff(rate.diff)}</span>
              </div>
            )}
          </div>
        ) : null}

        <style jsx>{`
          .wrapper {
            position: relative;
            display: flex;
            align-items: center;
            line-height: 1.1;
          }
          .popup {
            position: absolute;
            bottom: 20px;
            right: -29px;
            width: 187px;
            padding: 6px;
            border: 1px solid #1ED760;
            background: rgba(0,0,0,.75);
          }
          .rateRow {
            line-height: 1.5;
          }
          .rateDate {
            font-weight: normal;
          }
        `}</style>
      </div>
    )
  }
}
