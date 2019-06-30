package mylib
// Note. Package name does NOT have to match directory 
// - but it gets confusing if it doesn't

import (
	"fmt"
)

// AnotherUtilFunction must start with capital letter to be exported
func AnotherUtilFunction() {
	fmt.Println("Hello this is AnotherUtilFunction()")
}