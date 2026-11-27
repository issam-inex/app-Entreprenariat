<?php

return [
    'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS',
        'localhost,localhost:5173,localhost:4173,127.0.0.1,127.0.0.1:5173,127.0.0.1:4173,127.0.0.1:8000')),
    'guard' => ['web'],
    'expiration' => null,
];
