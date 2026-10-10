#!/usr/bin/env bash
set -e
B=${BASE:-http://localhost:3000}
echo "hospitals: $(curl -sf $B/api/hospitals | grep -o '"id":"[a-z]*"' | tr '\n' ' ')"
for p in \
 '{"hospital_id":"piedmont","household_size":3,"annual_income":38000,"bill_amount":9400,"insurance_status":"uninsured","county":"Fulton","state":"GA"}' \
 '{"hospital_id":"emory","household_size":3,"annual_income":65000,"bill_amount":9400,"insurance_status":"uninsured","county":"Fulton","state":"GA"}' \
 '{"hospital_id":"grady","household_size":2,"annual_income":50000,"bill_amount":4200,"insurance_status":"uninsured","county":"Cobb","state":"GA"}'
do
  curl -sf $B/api/eligibility -H 'content-type: application/json' -d "$p" \
    | grep -o '"fpl_pct":[0-9]*\|"status":"[a-z_]*"\|"bill_after":[0-9.]*\|"bill_after":null\|"residency_ok":[a-z]*' | tr '\n' ' '
  echo
done
