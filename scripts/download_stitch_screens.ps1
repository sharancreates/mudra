$ErrorActionPreference = "Stop"

$screens = @(
    @{
        id = "01-landing-page"
        img = "https://lh3.googleusercontent.com/aida/AEtjO1W1Qu9CnDx3iFNgUIDjOTKaqhrTzMeosfKwRxK7Z-af0R-5UGSFZQbsCteGVwIulhmAz55EpGb6SwkqTWuPKj6gnPBgkfIcs8PRVMf8SkYf1yIQGP_LWSiwmD6AIAbrU2RJJm2GKBo_it_4d8kvTzKUozVaGBaYHu3QCIPb4BSB3AQvlA-2cvFdKSM6Npq5KVDlqib0c2f6G2HF_XiW8fYCM_bc1SCmhpPdduuvA_y1zsPklaYykjLAw8s"
        html = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1ZDdhMTk3MGZjNjMwNzc5YTA1ZjhhMWU3ZTNjEgsSBxCmr9mT4A4YAZIBJAoKcHJvamVjdF9pZBIWQhQxMTEzMTI4NTg0NzM5MDM0MTk4Mw&filename=&opi=89354086"
    },
    @{
        id = "02-auth-modal"
        img = "https://lh3.googleusercontent.com/aida/AEtjO1WdEY8tHsxQ-xkOryxlQqUID_PglOX4TISPV_FFZfabedBQsEQPQhJqrjmlJl7JB2f3HG6-3CdmrJg6zXZ2-sDyx-zIKWGLj3tKOIlnpYuo8LRCrnBd-CuPrllZnJ3Tl67waTEzov9FTC7ky-y-bB3XKubY9fOrBiDRVi3EAJGYOdnmUNxLSHsO1yBtWvhHEGvuAMAcT7JlEYUvTY_NIRqZ2zjleSJL6Ut52WsR8DJRZ4299UuJmN_5fPy1"
        html = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1ZDdhMWI3OWM2ZTkwNjM5NzVjZDI0MWI4NmZiEgsSBxCmr9mT4A4YAZIBJAoKcHJvamVjdF9pZBIWQhQxMTEzMTI4NTg0NzM5MDM0MTk4Mw&filename=&opi=89354086"
    },
    @{
        id = "03-dashboard"
        img = "https://lh3.googleusercontent.com/aida/AEtjO1UfQznyQS2PYsPny1sgDTEy8PYmvsVlL_rl9OVokVr7fV8v8PkOkjIIm8jG7600f3Ao-l89XEFn5HPzTOyKfjG2rbmDqV051kHtu8CKrYMqxXDziRgBrsz-Fn_lhDooRL4y9SGaXswrOdzfdraFQAI_RsVYeV5d13bzES6qvIZUjoIXXbtVX9HP1_wiFATlW31X9bGhVYllv6YVD7KDuwpdnrx0dF65NS3lCn85pqxMVu025RVm7BgpJSM"
        html = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1ZDdhMWE0OTg2NTEwNWMyZmM1MWQyMTFlYmQwEgsSBxCmr9mT4A4YAZIBJAoKcHJvamVjdF9pZBIWQhQxMTEzMTI4NTg0NzM5MDM0MTk4Mw&filename=&opi=89354086"
    },
    @{
        id = "04-stock-detail"
        img = "https://lh3.googleusercontent.com/aida/AEtjO1VZjK9GLuarz7zUwKL7TPHHEnEcMOxIVI4D4rSJaHJHiT3GYsINJrQgh4xU6V1GxlGhx8jySPguIAvvWvaR-GhzHJFGEPhFBJ5rS1kY-7qR_-VkqYhLLxTmWm5V07kdQUyHLvJg_0cKiCHyuk4dOHSGMh85GSGkTrgFP3qetQ26417dWG_yb6GzlY7rjSSNO86fKZT3na1q-6e79z0X1YnGHqfO7PVjooVZVe4Y9-DbGtwYktGfDfQv22ln"
        html = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1ZDdhMWMzYjM3OTYwNTc2MzE3MmVkMTExM2YyEgsSBxCmr9mT4A4YAZIBJAoKcHJvamVjdF9pZBIWQhQxMTEzMTI4NTg0NzM5MDM0MTk4Mw&filename=&opi=89354086"
    },
    @{
        id = "05-market-explorer"
        img = "https://lh3.googleusercontent.com/aida/AEtjO1WTt48LABYTFXI8o94kalQ6FkXPg92mXE02tM_XUh2IcT0e-CUBeXI0iqQh-yD5w2YXE3adPcmOb7QKpuzsJgTSMWguG_geqjQNrSS9miMfnk9o78KJ5EwGRXwOVmHeT3C3CIebrLgCNEVCf0Tm50ukJiLBK6XkkkyVHveXSWZyrRLQdhu3MSsK9RG64eFBTbowYd2sEoKuyfVWDIyssN1RtKmqnebItva_LlOaEpscMtJuI3ElT8hzbUjO"
        html = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1ZDdhMWE5YWJjMmUwN2M0ZTU2NTFhMmY5OTIyEgsSBxCmr9mT4A4YAZIBJAoKcHJvamVjdF9pZBIWQhQxMTEzMTI4NTg0NzM5MDM0MTk4Mw&filename=&opi=89354086"
    },
    @{
        id = "06-sell-order-modal"
        img = "https://lh3.googleusercontent.com/aida/AEtjO1UU2LkN_Ljz7ZG1_vqpSZ8j3CLn7ZpIBwkKn2UlZmaC5T1EsbyK2z44CfTKfKnINg2RPWZuBcFpAI8ixesa30a1scioq5-OH9gbZHfMn-3I5Xu5I5FyVzS-tI9UQ7P90Yh39D0RuVFOUnewYr1RqhxXDgnzjfOhC4cWhUEkiEqPwQvWsqRY-NvTtdIcxpmLdSUAWNH2m9MtLe0d2ZQ5mANL_MdX-X_9MdD7b9JLD0bYyt5ih-sM8fv8Ago"
        html = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1ZDdhMWE3NzA4MjIwNTAzYzFmOGQzMTdmYTIyEgsSBxCmr9mT4A4YAZIBJAoKcHJvamVjdF9pZBIWQhQxMTEzMTI4NTg0NzM5MDM0MTk4Mw&filename=&opi=89354086"
    },
    @{
        id = "07-buy-order-modal"
        img = "https://lh3.googleusercontent.com/aida/AEtjO1W_8yhkx4UPlWbJeBlr1hDP-9NWIspQPynrhq9MGv5Dmw6zVytO-JuAotODI-PJaCRC4pr4zGPufsN0Sxbqj2OezUcCLWUJY9id3UV27KcYpwduIdDJmB2NiyZkDZa-ZZ_r0GOTner2dbAjCxzswPFvBM9MT7kPrz_h6yUqJbl508MI1xUYUY-qt_I0Y-Gg-2wB34HxIycWNEqdHT2CmO24r2LIlLxe9fbGN6vwR-Ii87-Wl3ATZyQbJM7V"
        html = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1ZDdhMWE2YmE5ZTgwMzMyYzBlZDg0MzFlN2QwEgsSBxCmr9mT4A4YAZIBJAoKcHJvamVjdF9pZBIWQhQxMTEzMTI4NTg0NzM5MDM0MTk4Mw&filename=&opi=89354086"
    }
)

foreach ($s in $screens) {
    $imgOut = "designs\stitch\$($s.id).png"
    $htmlOut = "designs\stitch\$($s.id).html"
    Write-Host "Downloading $($s.id)..."
    curl.exe -L -s "$($s.img)" -o $imgOut
    curl.exe -L -s "$($s.html)" -o $htmlOut
}

Write-Host "All screens downloaded successfully to designs/stitch/"
