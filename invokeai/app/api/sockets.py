# Copyright (c) 2022 Kyle Schouviller (https://github.com/kyle0654)

from typing import Any

from fastapi import FastAPI
from pydantic import BaseModel
from socketio import ASGIApp, AsyncServer

from invokeai.app.services.events.events_common import (
    BatchEnqueuedEvent,
    FastAPIEvent,
    InvocationCompleteEvent,
    InvocationDenoiseProgressEvent,
    InvocationErrorEvent,
    InvocationStartedEvent,
    ModelEvent,
    ModelInstalLCancelledEvent,
    ModelInstallCompletedEvent,
    ModelInstallDownloadProgressEvent,
    ModelInstallErrorEvent,
    ModelInstallStartedEvent,
    ModelLoadCompleteEvent,
    ModelLoadStartedEvent,
    QueueClearedEvent,
    QueueEvent,
    QueueItemStatusChangedEvent,
    SessionCanceledEvent,
    SessionCompleteEvent,
    SessionStartedEvent,
    register_events,
)


class QueueSubscriptionEvent(BaseModel):
    queue_id: str


class SocketIO:
    __sio: AsyncServer
    __app: ASGIApp

    def __init__(self, app: FastAPI):
        self.__sio = AsyncServer(async_mode="asgi", cors_allowed_origins="*")
        self.__app = ASGIApp(socketio_server=self.__sio, socketio_path="/ws/socket.io")
        app.mount("/ws", self.__app)

        self.__sio.on("subscribe_queue", handler=self._handle_sub_queue)
        self.__sio.on("unsubscribe_queue", handler=self._handle_unsub_queue)

        register_events(
            [
                InvocationStartedEvent,
                InvocationDenoiseProgressEvent,
                InvocationCompleteEvent,
                InvocationErrorEvent,
                SessionStartedEvent,
                SessionCompleteEvent,
                SessionCanceledEvent,
                QueueItemStatusChangedEvent,
                BatchEnqueuedEvent,
                QueueClearedEvent,
            ],
            self._handle_queue_event,
        )

        register_events(
            [
                ModelLoadStartedEvent,
                ModelLoadCompleteEvent,
                ModelInstallDownloadProgressEvent,
                ModelInstallStartedEvent,
                ModelInstallCompletedEvent,
                ModelInstalLCancelledEvent,
                ModelInstallErrorEvent,
            ],
            self._handle_model_event,
        )

    async def _handle_sub_queue(self, sid: str, data: Any) -> None:
        await self.__sio.enter_room(sid, QueueSubscriptionEvent(**data).queue_id)

    async def _handle_unsub_queue(self, sid: str, data: Any) -> None:
        await self.__sio.leave_room(sid, QueueSubscriptionEvent(**data).queue_id)

    async def _handle_queue_event(self, event: FastAPIEvent[QueueEvent]):
        event_name, payload = event
        await self.__sio.emit(event=event_name, data=payload.model_dump(), room=payload.queue_id)

    async def _handle_model_event(self, event: FastAPIEvent[ModelEvent]) -> None:
        event_name, payload = event
        await self.__sio.emit(event=event_name, data=payload.model_dump())
