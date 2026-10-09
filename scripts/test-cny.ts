import { toChineseAmount, formatMoney } from '../src/utils/cny.ts'

const cases: [number, string][] = [
  [0, '零元整'],
  [100, '壹佰元整'],
  [200, '贰佰元整'],
  [500, '伍佰元整'],
  [600, '陆佰元整'],
  [1000, '壹仟元整'],
  [1200, '壹仟贰佰元整'],
  [2000, '贰仟元整'],
  [800, '捌佰元整'],
  [10000, '壹万元整'],
  [10001, '壹万零壹元整'],
  [80066, '捌万零陆拾陆元整'],
  [86600, '捌万陆仟陆佰元整'],
  [100000, '壹拾万元整'],
  [1000000, '壹佰万元整'],
  [10000000, '壹仟万元整'],
  [100000000, '壹亿元整'],
  [100010000, '壹亿零壹万元整'],
  [100000001, '壹亿零壹元整'],
  [20, '贰拾元整'],
  [10, '壹拾元整'],
  [100.5, '壹佰元伍角'],
  [0.5, '伍角'],
  [0.05, '伍分'],
  [1234.56, '壹仟贰佰叁拾肆元伍角陆分'],
]

let fail = 0
for (const [input, expected] of cases) {
  const got = toChineseAmount(input)
  const ok = got === expected
  if (!ok) fail++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${input}  ->  ${got}${ok ? '' : `   (expected ${expected})`}`)
}
console.log(`\n${cases.length - fail}/${cases.length} passed`)
console.log('formatMoney(86600) =', formatMoney(86600))
process.exit(fail ? 1 : 0)
