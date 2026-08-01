#include <iostream>
#include <cstring>

// Intentional Buffer Overflow vulnerability for testing AEGIS-PATCH LLM SAST
void copyUserInput(const char* input) {
    char buffer[10];
    // Vulnerable: strcpy does not check bounds
    std::strcpy(buffer, input);
    std::cout << "Input copied: " << buffer << std::endl;
}

int main(int argc, char* argv[]) {
    if (argc > 1) {
        copyUserInput(argv[1]);
    } else {
        std::cout << "Please provide an input argument." << std::endl;
    }
    return 0;
}
