package main

import (
	"fmt"
	"mymodule/cmd/mylib"

	// Note. All of the following will NOT work to import mylib
	// "cmd/mylib"
	// "./mylib"
	// "mylib"
)

func main() {
	fmt.Println("Hello World!")

	// We can call someHelper() from the extra.go file as it's in the same package 
	someHelper()
	
	// Call exported function from imported package mylib (in utils.go)
	mylib.SomeUtilFunction()

	// Call exported function from imported package mylib  (in more_utils.go)
	mylib.AnotherUtilFunction()
}