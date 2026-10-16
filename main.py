# Simple Python Program
import datetime

# 1. Take user inputs
name = input("Enter your name: ")
age = int(input("Enter your age: "))

# 2. Calculate the birth year automatically using the current date
current_year = datetime.datetime.now().year
birth_year = current_year - age

# 3. Print a personalized response using an f-string
print(f"\nHello, {name}! You were born in or around {birth_year}.")
