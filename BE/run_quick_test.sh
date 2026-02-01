#!/bin/bash

echo "=================================="
echo "Quick Batch Processing Test"
echo "=================================="
echo ""
echo "This will send 5 HIGH priority requests simultaneously."
echo "Watch the server terminal to see them batched together!"
echo ""
echo "Press Enter to continue or Ctrl+C to cancel..."
read

python3 quick_batch_test.py

echo ""
echo "=================================="
echo "Test complete!"
echo "=================================="
echo ""
echo "Check the server logs above to see:"
echo "  - [ENQUEUE] messages showing requests being queued"
echo "  - [DISPATCH] message showing batch being created"
echo "  - [BATCH_START] and [BATCH_COMPLETE] messages"
echo ""
