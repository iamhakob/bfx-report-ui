import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { withTranslation } from 'react-i18next'
import { Card, Elevation } from '@blueprintjs/core'
import _sortBy from 'lodash/sortBy'
import _isEqual from 'lodash/isEqual'

import {
  SectionHeader,
  SectionHeaderRow,
  SectionHeaderItem,
  SectionHeaderTitle,
  SectionHeaderItemLabel,
} from 'ui/SectionHeader'
import NoData from 'ui/NoData'
import Loading from 'ui/Loading'
import Chart from 'ui/Charts/Chart'
import TimeRange from 'ui/TimeRange'
import QueryButton from 'ui/QueryButton'
import RefreshButton from 'ui/RefreshButton'
import MultiPairSelector from 'ui/MultiPairSelector'
import TimeFrameSelector from 'ui/TimeFrameSelector'
import ReportTypeSelector from 'ui/ReportTypeSelector'
import parseChartData from 'ui/Charts/Charts.helpers'
import ClearFiltersButton from 'ui/ClearFiltersButton'
import queryConstants from 'state/query/constants'
import constants from 'ui/ReportTypeSelector/constants'
import {
  checkInit,
  checkFetch,
  togglePair,
  clearAllPairs,
} from 'state/utils'

const TYPE = queryConstants.MENU_FEES_REPORT

const getReportTypeParams = (type) => {
  switch (type) {
    case constants.TRADING_FEES:
      return { isTradingFees: true, isFundingFees: false }
    case constants.FUNDING_FEES:
      return { isTradingFees: false, isFundingFees: true }
    case constants.FUNDING_TRADING_FEES:
      return { isTradingFees: true, isFundingFees: true }
    default:
      return { isTradingFees: true, isFundingFees: false }
  }
}

class FeesReport extends PureComponent {
  static propTypes = {
    currentFetchParams: PropTypes.shape({
      timeframe: PropTypes.string,
      targetPairs: PropTypes.arrayOf(PropTypes.string),
    }),
    dataReceived: PropTypes.bool.isRequired,
    entries: PropTypes.arrayOf(PropTypes.shape({
      mts: PropTypes.number.isRequired,
    })),
    fetchData: PropTypes.func.isRequired,
    pageLoading: PropTypes.bool.isRequired,
    params: PropTypes.shape({
      timeframe: PropTypes.string,
      targetPairs: PropTypes.arrayOf(PropTypes.string),
    }),
    refresh: PropTypes.func.isRequired,
    reportType: PropTypes.string.isRequired,
    setParams: PropTypes.func.isRequired,
    setReportType: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
    targetPairs: PropTypes.arrayOf(PropTypes.string),
  }

  static defaultProps = {
    params: {},
    entries: [],
    targetPairs: [],
    currentFetchParams: {},
  }

  componentDidMount() {
    checkInit(this.props, TYPE)
  }

  componentDidUpdate(prevProps) {
    checkFetch(prevProps, this.props, TYPE)
  }

  handleQuery = () => {
    const { fetchData } = this.props
    fetchData()
  }

  handleTimeframeChange = (timeframe) => {
    const { setParams } = this.props
    setParams({ timeframe })
  }

  hasChanges = () => {
    const { currentFetchParams, params } = this.props
    return !_isEqual(currentFetchParams, params)
  }

  clearPairs = () => clearAllPairs(TYPE, this.props)

  handleReportTypeChange = (type) => {
    const { setParams, setReportType } = this.props
    const params = getReportTypeParams(type)
    setReportType(type)
    setParams(params)
  }

  render() {
    const {
      t,
      entries,
      refresh,
      targetPairs,
      pageLoading,
      dataReceived,
      params: { timeframe },
      reportType,
    } = this.props
    const hasChanges = this.hasChanges()

    const { chartData, presentCurrencies } = parseChartData({
      timeframe,
      data: _sortBy(entries, ['mts']),
    })

    let showContent
    if (!dataReceived && pageLoading) {
      showContent = <Loading />
    } else if (!entries.length) {
      showContent = <NoData />
    } else {
      showContent = (
        <Chart
          isSumUpEnabled
          data={chartData}
          dataKeys={presentCurrencies}
        />
      )
    }
    return (
      <Card
        elevation={Elevation.ZERO}
        className='col-lg-12 col-md-12 col-sm-12 col-xs-12'
      >
        <SectionHeader>
          <SectionHeaderTitle>
            {t('feesreport.title')}
          </SectionHeaderTitle>
          <TimeRange className='section-header-time-range' />
          <SectionHeaderRow>
            <SectionHeaderItem>
              <SectionHeaderItemLabel>
                {t('selector.filter.symbol')}
              </SectionHeaderItemLabel>
              <MultiPairSelector
                currentFilters={targetPairs}
                togglePair={pair => togglePair(TYPE, this.props, pair)}
              />
            </SectionHeaderItem>
            <ClearFiltersButton onClick={this.clearPairs} />
            <SectionHeaderItem>
              <SectionHeaderItemLabel>
                {t('selector.select')}
              </SectionHeaderItemLabel>
              <TimeFrameSelector
                value={timeframe}
                onChange={this.handleTimeframeChange}
              />
            </SectionHeaderItem>
            <SectionHeaderItem>
              <SectionHeaderItemLabel>
                {t('selector.report-type.title')}
              </SectionHeaderItemLabel>
              <ReportTypeSelector
                section={TYPE}
                value={reportType}
                onChange={this.handleReportTypeChange}
              />
            </SectionHeaderItem>
            <QueryButton
              disabled={!hasChanges}
              onClick={this.handleQuery}
            />
            <RefreshButton onClick={refresh} />
          </SectionHeaderRow>
        </SectionHeader>
        {showContent}
      </Card>
    )
  }
}

export default withTranslation('translations')(FeesReport)
