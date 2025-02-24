import csv
import random

zipcodes = [f"90{str(i).zfill(3)}" for i in range(1, 90)] + [f"941{str(i).zfill(2)}" for i in range(2, 13)]
with open('ZipCodes.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['ZipCode', 'Total number of companies', 'Total sales', 'Total employees', 'RMAT Number'])
    for zipcode in zipcodes[:100]:  # Ensure exactly 100
        companies = random.randint(2, 10)
        sales = companies * random.randint(20000, 30000)
        employees = companies * random.randint(8, 12)
        rmat = random.randint(1, 10)
        writer.writerow([zipcode, companies, sales, employees, rmat])