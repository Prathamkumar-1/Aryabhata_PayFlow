import pytest


async def _drain_until(queue, predicate, max_events: int = 8):
    import asyncio

    seen = []
    for _ in range(max_events):
        event = await asyncio.wait_for(queue.get(), timeout=1.0)
        seen.append(event)
        if predicate(event):
            return event, seen
    raise AssertionError(f"Expected SSE event was not published. Seen: {seen}")


@pytest.mark.asyncio
async def test_analyst_escalation_queue_structures_and_decides_case():
    from src.api.events import EventBroadcaster
    from src.api.routes.analyst import (
        EscalationDecisionRequest,
        clear_store,
        decide_escalation,
        list_escalations,
        receive_escalation,
    )

    EventBroadcaster.reset()
    queue = await EventBroadcaster.get().subscribe(["analyst", "graph", "transaction_decision"])
    clear_store()
    ack = await receive_escalation({
        "escalation_id": "esc-queue-001",
        "txn_id": "TXN-QUEUE-001",
        "node_id": "ACC-QUEUE-01",
        "agent_confidence": 0.58,
        "confidence_threshold": 0.82,
        "ml_score": 0.91,
        "gnn_score": 0.72,
        "detected_typology": "LAYERING",
        "reasoning_trace": ["low confidence", "layering evidence"],
        "evidence_collected": {"ml": {"score": 0.91}},
        "graph_context": {
            "available": True,
            "subgraph": {"nodes": 8, "edges": 11},
            "patterns": {"mule_network_detected": True, "cycles_found": 2},
        },
    })

    cases = await list_escalations()
    assert len(cases) == 1
    case = cases[0]
    assert case["ack_id"] == ack.ack_id
    assert case["case_id"].startswith("HITL-")
    assert case["status"] == "pending_review"
    assert case["priority"] in {"high", "critical"}
    assert case["txn_id"] == "TXN-QUEUE-001"
    assert case["evidence_summary"]["mule_network_detected"] is True
    assert case["audit_hash"]

    decided = await decide_escalation(
        ack.ack_id,
        EscalationDecisionRequest(
            decision="escalate",
            analyst="union_bank_fiu",
            reason="fiu_review_required",
        ),
    )
    assert decided["status"] == "escalated"
    assert decided["analyst"] == "union_bank_fiu"
    assert decided["decision_history"][-1]["decision"] == "escalate"

    decision_event, _ = await _drain_until(
        queue,
        lambda event: event["channel"] == "transaction_decision"
        and event["data"]["type"] == "case_resolution",
    )
    assert decision_event["data"]["txn_id"] == "TXN-QUEUE-001"
    assert decision_event["data"]["node_id"] == "ACC-QUEUE-01"
    assert decision_event["data"]["node_status"] == "suspicious"
    assert decision_event["data"]["fanout"]["activity_lifecycle"] is True
    assert decision_event["data"]["fanout"]["graph_node_status"] is True
    assert "topology" in decision_event["data"]["fanout"]["query_groups"]
    assert "risk-distribution" in decision_event["data"]["fanout"]["query_groups"]
    assert "countermeasure-proposals" in decision_event["data"]["fanout"]["query_groups"]
    assert "circuit-breaker" in decision_event["data"]["fanout"]["query_groups"]
    assert "fraud" in decision_event["data"]["fanout"]["query_groups"]

    graph_event, _ = await _drain_until(
        queue,
        lambda event: event["channel"] == "graph"
        and event["data"].get("type") == "node_status_changed",
    )
    assert graph_event["data"]["node_id"] == "ACC-QUEUE-01"
    assert graph_event["data"]["status"] == "suspicious"
    assert graph_event["data"]["source"] == "analyst_decision"

    await EventBroadcaster.get().unsubscribe(queue, ["analyst", "graph", "transaction_decision"])
    clear_store()
