import csv

expected_columns = ["project_id", "progress_percent", "materials_used", "workforce", "days_elapsed", "days_remaining"]

data = [
    [1, 50, 100, 10, 20, 10],
    [2, 80, 150, 12, 15, 5],
    [3, 30, 75, 8, 25, 15],
]

filename = "progress.csv"

with open(filename, mode="w", newline="") as file:
    writer = csv.writer(file)    
    writer.writerow(expected_columns)    
    writer.writerows(data)

print(f"CSV file '{filename}' created successfully.")
