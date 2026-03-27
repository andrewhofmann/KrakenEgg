// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "KrakenEgg",
    platforms: [
        .macOS(.v14)
    ],
    products: [
        .executable(
            name: "KrakenEgg",
            targets: ["KrakenEgg"])
    ],
    dependencies: [
        // Add dependencies here if needed
    ],
    targets: [
        .executableTarget(
            name: "KrakenEgg",
            dependencies: [],
            path: "Sources/KrakenEgg"
        )
    ]
)