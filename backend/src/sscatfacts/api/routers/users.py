from typing import Annotated

from fastapi import APIRouter, Path

from sscatfacts.api.dependencies import CurrentUserId, UserServiceDependency
from sscatfacts.api.schemas import (
    USERNAME_PATTERN,
    ProfileUpdate,
    UsernameAvailabilityResponse,
    UserResponse,
    user_response,
)

router = APIRouter(tags=["users"])


@router.get(
    "/usernames/{username}/availability",
    response_model=UsernameAvailabilityResponse,
)
async def username_availability(
    username: Annotated[
        str,
        Path(min_length=3, max_length=30, pattern=USERNAME_PATTERN),
    ],
    service: UserServiceDependency,
) -> UsernameAvailabilityResponse:
    return UsernameAvailabilityResponse(
        username=username,
        available=await service.username_availability(username),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(
    user_id: CurrentUserId,
    service: UserServiceDependency,
) -> UserResponse:
    return user_response(await service.get_profile(user_id))


@router.put("/me/profile", response_model=UserResponse)
async def save_profile(
    payload: ProfileUpdate,
    user_id: CurrentUserId,
    service: UserServiceDependency,
) -> UserResponse:
    return user_response(await service.save_profile(user_id, payload.username))
