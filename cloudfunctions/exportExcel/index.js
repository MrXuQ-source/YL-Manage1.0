const cloud = require('wx-server-sdk')
const xlsx = require('node-xlsx')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event) => {
  const { startDate, endDate, status, wasteName, wasteCode, department, device } = event

  let whereCondition = {}
  if (status && status !== '全部') {
    if (status === '在库') whereCondition.status = 1
    else if (status === '已出库') whereCondition.status = 2
  }
  if (wasteName) whereCondition.wasteName = _.regex(wasteName, 'i')
  if (wasteCode) whereCondition.wasteCode = _.regex(wasteCode, 'i')
  if (department) whereCondition.department = _.regex(department, 'i')
  if (device) whereCondition.device = _.regex(device, 'i')
  if (startDate && endDate) whereCondition.produceDate = _.gte(startDate).and(_.lte(endDate))

  try {
    const res = await db.collection('produce_log')
      .where(whereCondition)
      .orderBy('create_time', 'desc')
      .limit(100)
      .get()

    const data = [['批次', '出库编码', '危废名称', '危废代码', '运行部', '装置', '重量(吨)', '容器编号', '日期', '状态', '出库时间']]

    res.data.forEach(item => {
      let statusText = '待称重'
      if (item.status === 1) statusText = '在库'
      if (item.status === 2) statusText = '已出库'

      data.push([
        item.packageNo || item.batchNo || '',
        item.outboundNo || '',
        item.wasteName || '',
        item.wasteCode || '',
        item.department || '',
        item.device || '',
        item.weight || '',
        item.containerCode || '',
        item.produceDate || '',
        statusText,
        item.outbound_time ? item.outbound_time.toString() : ''
      ])
    })

    const buffer = xlsx.build([{ name: '危废数据', data: data }])
    const fileName = `export_${Date.now()}.xlsx`
    const uploadRes = await cloud.uploadFile({
      cloudPath: `exports/${fileName}`,
      fileContent: buffer
    })

    return { success: true, fileID: uploadRes.fileID }
  } catch (err) {
    return { success: false, msg: err.message }
  }
}