import React, { memo } from 'react'
import {
  Position,
  Tooltip,
} from '@blueprintjs/core'

import config from 'config'

import { propTypes, defaultProps } from './QueryMode.props'
import {
  getModeIcon,
  getModeTitle,
  getModeTooltipMessage,
} from './QueryMode.helpers'

const QueryMode = ({ syncMode, switchSyncMode, t }) => {
  const switchMode = () => {
    switchSyncMode(syncMode)
  }

  const modeIcon = getModeIcon(syncMode)

  if (!config.showFrameworkMode) {
    return null
  }

  return (
    <>
      <Tooltip
        className='query-mode'
        content={t(getModeTooltipMessage(syncMode))}
        position={Position.BOTTOM}
      >
        <div className='query-mode-wrapper' onClick={switchMode}>
          <div className='query-mode-icon-wrapper'>
            <div className='query-mode-icon'>
              {modeIcon}
            </div>
          </div>
          <span className='query-mode-status'>{t(getModeTitle(syncMode))}</span>
        </div>
      </Tooltip>
    </>
  )
}


QueryMode.propTypes = propTypes
QueryMode.defaultProps = defaultProps

export default memo(QueryMode)
