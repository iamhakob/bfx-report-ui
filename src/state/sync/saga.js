import {
  call,
  cancelled,
  put,
  select,
  takeLatest,
} from 'redux-saga/effects'
import { delay } from 'redux-saga'

import { makeFetchCall } from 'state/utils'
import { getAuthStatus, selectAuth, getIsShown } from 'state/auth/selectors'
import authTypes from 'state/auth/constants'
import { hideAuth } from 'state/auth/actions'
import { updateErrorStatus, updateStatus } from 'state/status/actions'

import types from './constants'
import actions from './actions'
import { getSyncMode } from './selectors'

const checkIsSyncModeWithDbData = auth => makeFetchCall('isSyncModeWithDbData', auth)
const getSyncProgress = () => makeFetchCall('getSyncProgress')
const isSchedulerEnabled = () => makeFetchCall('isSchedulerEnabled')
const syncNow = auth => makeFetchCall('syncNow', auth)
const logout = auth => makeFetchCall('logout', auth)
const enableSyncMode = auth => makeFetchCall('enableSyncMode', auth)
const disableSyncMode = auth => makeFetchCall('disableSyncMode', auth)

function updateSyncErrorStatus(msg) {
  return updateErrorStatus({
    id: 'status.request.error',
    topic: 'sync.title',
    detail: msg,
  })
}

function* startSyncing() {
  yield delay(300)
  const isShownAuth = yield select(getIsShown)
  const auth = yield select(selectAuth)
  const { result, error } = yield call(enableSyncMode, auth)
  if (result) {
    yield delay(300)
    const { result: syncNowOk, error: syncNowError } = yield call(syncNow, auth)
    if (syncNowOk) {
      yield put(actions.setSyncMode(types.MODE_SYNCING))
      if (isShownAuth) {
        yield put(hideAuth())
      }
      yield put(updateStatus({ id: 'sync.start' }))
    }
    if (syncNowError) {
      yield put(updateSyncErrorStatus('during syncNow'))
    }
  }
  if (error) {
    yield put(updateSyncErrorStatus('during enableSyncMode'))
  }
}

function* stopSyncing() {
  yield delay(300)
  const auth = yield select(selectAuth)
  const { result, error } = yield call(disableSyncMode, auth)
  if (result) {
    yield put(actions.setSyncMode(types.MODE_ONLINE))
    yield put(updateStatus({ id: 'sync.stop-sync' }))
  }
  if (error) {
    yield put(updateSyncErrorStatus('during disableSyncMode'))
  }
}

function* forceQueryFromDb() {
  const isShownAuth = yield select(getIsShown)
  yield put(actions.setSyncMode(types.MODE_OFFLINE))
  if (isShownAuth) {
    yield put(hideAuth())
  }
  yield put(updateStatus({ id: 'sync.go-offline' }))
}

function* syncLogout() {
  yield delay(300)
  const auth = yield select(selectAuth)
  const { result, error } = yield call(logout, auth)
  if (result) {
    yield put(actions.setSyncMode(types.MODE_ONLINE))
    yield put(updateStatus({ id: 'sync.logout' }))
  }
  if (error) {
    yield put(updateSyncErrorStatus('during logout'))
  }
}

function* syncWatcher() {
  try {
    while (true) {
      const authState = yield select(getAuthStatus)
      const isShownAuth = yield select(getIsShown)
      if (authState) {
        const auth = yield select(selectAuth)
        const { result: isQueryWithDb } = yield call(checkIsSyncModeWithDbData, auth)
        // get current ui state
        const syncMode = yield select(getSyncMode)
        yield delay(300)
        const { result: progress } = yield call(getSyncProgress)
        // console.warn('queryWithDb, %', isQueryWithDb, progress)
        if (isQueryWithDb) {
          // when progress 100 => offline mode
          if (progress && progress === 100) {
            if (syncMode !== types.MODE_OFFLINE) {
              yield put(actions.forceQueryFromDb())
            }
          } else if (syncMode !== types.MODE_SYNCING) {
            yield put(actions.startSyncing())
          }
        } else {
          switch (typeof progress) {
            case 'number':
              // when progress 0~99 => syncing mode
              if (progress !== 100) {
                if (syncMode !== types.MODE_SYNCING) {
                  const { result: hasSched, error: schedError } = yield call(isSchedulerEnabled)
                  if (!hasSched) {
                    yield put(actions.startSyncing())
                  } else {
                    yield put(actions.setSyncMode(types.MODE_SYNCING))
                    if (isShownAuth) {
                      yield put(hideAuth())
                    }
                  }

                  if (schedError) {
                    yield put(updateSyncErrorStatus('during check isSchedulerEnabled'))
                  }
                }
              }
              break
            // when progress false => online mode
            case 'boolean':
              if (syncMode !== types.MODE_ONLINE) {
                yield put(actions.setSyncMode(types.MODE_ONLINE))
                if (isShownAuth) {
                  yield put(hideAuth())
                }
              }
              break
            // when progress error after the main page is shown => show notification and stop syncing
            case 'string':
            default:
              if (!isShownAuth) {
                yield put(updateSyncErrorStatus(progress))
                yield put(actions.stopSyncing())
              }
              break
          }
        }
      }
      yield delay(5000) // check every 5s
    }
  } finally {
    if (yield cancelled()) {
      yield put(updateErrorStatus({
        id: 'sync.message.canceled',
      }))
    }
  }
}

export default function* syncSaga() {
  yield takeLatest(types.START_SYNCING, startSyncing)
  yield takeLatest(types.STOP_SYNCING, stopSyncing)
  yield takeLatest(types.FORCE_OFFLINE, forceQueryFromDb)
  yield takeLatest(authTypes.UPDATE_AUTH_STATUS, syncWatcher)
  yield takeLatest(authTypes.LOGOUT, syncLogout)
}
