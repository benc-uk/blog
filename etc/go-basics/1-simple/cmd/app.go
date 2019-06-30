package main

import (
	"fmt"
)

func main() {
	fmt.Println("Hello World!")

	// We can call someHelper() from the extra.go file as it's in the same package 
	someHelper()
}