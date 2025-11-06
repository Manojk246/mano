# -------------------------------
# Logout Route
# -------------------------------
@router.post("/logout")
def logout_user():
    response = JSONResponse(content={"message": "Logged out successfully ✅"})
    response.delete_cookie(
        key="access_token",
        domain="localhost",  # must match the domain used in set_cookie
        path="/"
    )
    return response
